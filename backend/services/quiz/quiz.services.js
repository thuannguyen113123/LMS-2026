import Quiz from "../../models/quiz/quiz.model.js";
import Course from "../../models/courses/Course.js";
import Lesson from "../../models/lesson/lesson.model.js";
import Student from "../../models/student/student.model.js";
import Instructor from "../../models/instructor/instructor.model.js";
import LessonProgress from "../../models/lessonProgress/lessonProgress.model.js";

import mongoose from "mongoose";
import AppError from "../../utils/AppError.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import { quizBulkItemSchema } from "../../validators/quiz/quiz.validator.js";
import { QUIZ_CODES } from "../../constants/quiz.codes.js";
import { ROLES } from "../../middlewares/auth.js";
import { exportQuizzesFile } from "./quiz.export.js";

export function getUserIdentifier(user) {
  return user?._id || user?.id || null;
}

export const mapQuiz = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  return {
    id: doc._id.toString(),

    title: doc.title,
    slug: doc.slug,

    scope: doc.scope, // "course" | "lesson"
    type: doc.type, // "quiz" | "exam" | "practice"

    course: doc.course,
    lesson: doc.lesson,

    timeLimit: doc.timeLimit,
    passingScore: doc.passingScore,

    shuffleQuestions: doc.shuffleQuestions,
    shuffleOptions: doc.shuffleOptions,
    maxAttempts: doc.maxAttempts,

    isPublished: doc.isPublished,

    createdBy: doc.createdBy,

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};
export async function buildQuizFilter({ query, role, userId }) {
  const filter = {};

  const { scope, lessonId, courseSlug, courseId, search } = query;

  if (role === "instructor") {
    const instructorDoc = await Instructor.findOne({ user: userId })
      .select("_id")
      .lean();

    if (!instructorDoc) {
      filter._id = null;
      return filter;
    }

    const courses = await Course.find({ instructor: instructorDoc._id })
      .select("_id")
      .lean();

    filter.course = { $in: courses.map((c) => c._id) };
  }

  if (role === "student") {
    const student = await Student.findOne({ user: userId })
      .select("enrolledCourses.course")
      .lean();

    if (!student) {
      filter._id = null;
      return filter;
    }

    filter.course = {
      $in: student.enrolledCourses.map((ec) => ec.course),
    };

    filter.isPublished = true;
  }

  /* ================= COURSE ================= */

  // ✅ ADMIN FILTER
  if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
    filter.course = courseId;
  }

  // ✅ PUBLIC FILTER
  if (courseSlug) {
    const course = await Course.findOne({ slug: courseSlug })
      .select("_id")
      .lean();

    if (!course) {
      filter._id = null;
      return filter;
    }

    filter.course = course._id;
  }

  /* ================= LESSON ================= */

  if (scope === "lesson" && lessonId) {
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      throw new AppError(
        QUIZ_CODES.QUIZ_INVALID_LESSON_ID,
        "lessonId không hợp lệ",
        400
      );
    }

    filter.lesson = lessonId;
  }

  /* ================= SEARCH (FIX BUG #2) ================= */

  if (search?.trim()) {
    filter.title = {
      $regex: search.trim(),
      $options: "i",
    };
  }

  return filter;
}
export function buildQuizSort(sort) {
  switch (sort) {
    case "oldest":
      return { createdAt: 1, _id: 1 };

    case "title_asc":
      return { title: 1, _id: 1 };

    case "latest":
    default:
      return { createdAt: -1, _id: -1 };
  }
}
export const validateQuizExportScope = ({ scope, selectedIds }) => {
  if (!["ALL", "SELECTED", "CURRENT_PAGE"].includes(scope)) {
    throw new AppError(
      QUIZ_CODES.QUIZ_EXPORT_SCOPE_INVALID,
      "Phạm vi export không hợp lệ",
      400
    );
  }

  if (scope === "SELECTED" && (!selectedIds || selectedIds.length === 0)) {
    throw new AppError(
      QUIZ_CODES.QUIZ_EXPORT_SELECTED_EMPTY,
      "Chưa chọn quiz để export",
      400
    );
  }
};

export const validateQuizExportFormat = (format) => {
  if (!["excel", "pdf"].includes(format)) {
    throw new AppError(
      QUIZ_CODES.QUIZ_EXPORT_FORMAT_INVALID,
      "Định dạng export không hợp lệ",
      400
    );
  }
};
export function buildMyQuizMatcher(query = {}) {
  const { search, status } = query;

  let keyword = null;

  if (search?.trim()) {
    keyword = new RegExp(search.trim(), "i");
  }

  return function match(card) {
    /* ========= SEARCH ========= */

    if (keyword) {
      const matched =
        keyword.test(card.title) ||
        keyword.test(card.courseTitle) ||
        keyword.test(card.lessonTitle);

      if (!matched) return false;
    }

    /* ========= STATUS ========= */

    if (status && card.status !== status) {
      return false;
    }

    return true;
  };
}

const QuizServices = {
  async createQuiz(data, user) {
    try {
      const title = data.title?.trim();

      if (!title) {
        throw new AppError(
          QUIZ_CODES.QUIZ_CREATE_FAILED,
          "Tiêu đề quiz không hợp lệ",
          400
        );
      }

      // ✅ duplicate check (nếu có slug / code)
      if (data.slug) {
        const existed = await Quiz.findOne({ slug: data.slug });
        if (existed) {
          throw new AppError(QUIZ_CODES.QUIZ_EXISTS, "Quiz đã tồn tại", 409);
        }
      }

      const created = await Quiz.create({
        ...data,
        title,
      });

      // ✅ audit log trong service
      await saveAuditLogs({
        entityType: "quiz",
        entityId: created._id,
        action: "create",
        oldData: {},
        newData: {
          title: created.title,
          slug: created.slug,
          status: created.status,
        },
        updatedBy: user?.id || user?._id,
      });

      // ✅ trả mapQuiz
      return mapQuiz(created);
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("CreateQuiz service error:", err);
      throw err;
    }
  },
  async bulkCreateQuizzes(inputList = [], updatedBy) {
    console.log("===== BULK CREATE QUIZ START =====");

    if (!Array.isArray(inputList) || inputList.length === 0) {
      throw new AppError(
        QUIZ_CODES.QUIZ_BULK_INVALID_PAYLOAD,
        "Danh sách quiz không hợp lệ"
      );
    }

    console.log("TOTAL INPUT:", inputList.length);

    const validItems = [];
    const errors = [];

    // 1️⃣ Validate từng dòng
    inputList.forEach((item, index) => {
      const { error, value } = quizBulkItemSchema.validate(item, {
        abortEarly: false,
      });

      if (error) {
        console.log("❌ VALIDATION FAILED:", item?.title, error.details);
        errors.push({
          index,
          code: QUIZ_CODES.QUIZ_BULK_VALIDATION_FAILED,
          title: item?.title || null,
          reason: error.details.map((d) => d.message),
        });
      } else {
        validItems.push(value);
      }
    });

    console.log("VALID ITEMS:", validItems.length);

    // 2️⃣ Duplicate title trong file
    const seenTitle = new Set();
    const uniqueValid = [];

    for (const item of validItems) {
      const key = item.title.toLowerCase();

      if (seenTitle.has(key)) {
        console.log("❌ DUPLICATE TITLE IN FILE:", item.title);
        errors.push({
          code: QUIZ_CODES.QUIZ_BULK_DUPLICATE_IN_FILE,
          title: item.title,
          reason: ["Trùng title trong file"],
        });
        continue;
      }

      seenTitle.add(key);
      uniqueValid.push(item);
    }

    console.log("UNIQUE VALID:", uniqueValid.length);

    if (uniqueValid.length === 0) {
      console.log("⛔ STOP: No valid rows after duplicate filter");
      return {
        created: [],
        skipped: [],
        errors,
        summary: {
          total: inputList.length,
          created: 0,
          skipped: 0,
          failed: errors.length,
        },
      };
    }

    // 3️⃣ Resolve courseSlug
    const courseSlugs = [...new Set(uniqueValid.map((i) => i.courseSlug))];
    console.log("COURSE SLUGS:", courseSlugs);

    const courses = await Course.find({ slug: { $in: courseSlugs } })
      .select("_id slug")
      .lean();

    console.log("COURSES FOUND:", courses);

    const courseMap = new Map(courses.map((c) => [c.slug, c._id]));

    // 4️⃣ Resolve lessonSlug
    const lessonSlugs = uniqueValid
      .filter((i) => i.scope === "lesson" && i.lessonSlug)
      .map((i) => i.lessonSlug);

    console.log("LESSON SLUGS:", lessonSlugs);

    const lessons = await Lesson.find({ slug: { $in: lessonSlugs } })
      .select("_id slug course")
      .lean();

    console.log("LESSONS FOUND:", lessons);

    const lessonMap = new Map(lessons.map((l) => [l.slug, l]));

    // 5️⃣ Build mapped items
    const mappedItems = [];

    for (const item of uniqueValid) {
      console.log("----- CHECKING:", item.title);

      const courseId = courseMap.get(item.courseSlug);
      console.log("COURSE ID:", courseId?.toString());

      if (!courseId) {
        console.log("❌ COURSE NOT FOUND");
        errors.push({
          code: QUIZ_CODES.QUIZ_COURSE_NOT_FOUND,
          title: item.title,
          reason: [`Course slug "${item.courseSlug}" không tồn tại`],
        });
        continue;
      }

      let lessonId = null;

      if (item.scope === "lesson") {
        if (!item.lessonSlug) {
          console.log("❌ LESSON SLUG MISSING");
          errors.push({
            code: QUIZ_CODES.QUIZ_LESSON_NOT_FOUND,
            title: item.title,
            reason: ["Scope lesson cần lessonSlug"],
          });
          continue;
        }

        const lessonDoc = lessonMap.get(item.lessonSlug);
        console.log("LESSON DOC:", lessonDoc);

        if (!lessonDoc) {
          console.log("❌ LESSON NOT FOUND");
          errors.push({
            code: QUIZ_CODES.QUIZ_LESSON_NOT_FOUND,
            title: item.title,
            reason: [`Lesson slug "${item.lessonSlug}" không tồn tại`],
          });
          continue;
        }

        console.log(
          "COMPARE COURSE:",
          lessonDoc.course.toString(),
          "vs",
          courseId.toString()
        );

        if (!lessonDoc.course.equals(courseId)) {
          console.log("❌ SCOPE MISMATCH");
          errors.push({
            code: QUIZ_CODES.QUIZ_SCOPE_MISMATCH,
            title: item.title,
            reason: ["Lesson không thuộc courseSlug đã cho"],
          });
          continue;
        }

        lessonId = lessonDoc._id;
      }

      mappedItems.push({
        title: item.title,
        scope: item.scope,
        type: item.type,
        course: courseId,
        lesson: lessonId,
        timeLimit: item.timeLimit,
        passingScore: item.passingScore,
        maxAttempts: item.maxAttempts,
        shuffleQuestions: item.shuffleQuestions,
        shuffleOptions: item.shuffleOptions,
        isPublished: item.isPublished,
        createdBy: updatedBy,
      });
    }

    console.log("MAPPED ITEMS:", mappedItems.length);
    console.log("ERRORS:", errors);

    if (mappedItems.length === 0) {
      console.log("⛔ STOP: No mapped items");
      return {
        created: [],
        skipped: [],
        errors,
        summary: {
          total: inputList.length,
          created: 0,
          skipped: 0,
          failed: errors.length,
        },
      };
    }

    // 7️⃣ insertMany with try/catch
    let createdDocs = [];

    console.log(
      "TO CREATE SLUGS:",
      mappedItems.map((i) => i.title)
    );

    try {
      createdDocs = await Quiz.insertMany(mappedItems, {
        ordered: false,
      });
      console.log("✅ INSERT SUCCESS:", createdDocs.length);
    } catch (err) {
      console.error("❌ INSERT ERROR:", err);
    }

    // 8️⃣ audit log
    await Promise.all(
      createdDocs.map((q) =>
        saveAuditLogs({
          entityType: "quiz",
          entityId: q._id,
          oldData: {},
          newData: mapQuiz(q),
          updatedBy,
        })
      )
    );

    console.log("===== BULK CREATE QUIZ END =====");

    return {
      created: createdDocs.map(mapQuiz),
      skipped: [],
      errors,
      summary: {
        total: inputList.length,
        created: createdDocs.length,
        skipped: 0,
        failed: errors.length,
      },
    };
  },
  async listAdminQuizzesUseCase({ query, role, userId }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const skip = (page - 1) * limit;

    const filter = await buildQuizFilter({
      query,
      role,
      userId,
    });

    const sort = buildQuizSort(query.sort);

    const [docs, total] = await Promise.all([
      Quiz.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("course", "title slug")
        .lean(),

      Quiz.countDocuments(filter),
    ]);

    const data = docs.map(mapQuiz);

    return {
      data,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),

        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },
  async listPublicQuizzesUseCase({ query, userId, role }) {
    const limit = Number(query.limit) || 12;
    const cursor = query.cursor;

    let filter = await buildQuizFilter({
      query,
      role,
      userId,
    });

    if (cursor) {
      const cursorDoc = await Quiz.findById(cursor).select("createdAt");

      if (cursorDoc) {
        filter.$or = [
          {
            createdAt: { $lt: cursorDoc.createdAt },
          },
          {
            createdAt: cursorDoc.createdAt,
            _id: { $lt: cursor },
          },
        ];
      }
    }

    const docs = await Quiz.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("course", "title slug")
      .lean();

    const hasNext = docs.length > limit;

    if (hasNext) docs.pop();

    const data = docs.map(mapQuiz);

    return {
      data,

      pagination: {
        nextCursor: hasNext ? data[data.length - 1].id : null,
        hasNext,
      },
    };
  },
  async listMyQuizzesUseCase({ userId, query = {} }) {
    const limit = Number(query.limit) || 8;
    const cursor = query.cursor;

    const student = await Student.findOne({ user: userId })
      .select("_id enrolledCourses.course")
      .lean();

    if (!student) {
      return {
        data: [],
        pagination: { nextCursor: null, hasNext: false },
      };
    }

    const courseIds = student.enrolledCourses.map((ec) => ec.course);

    const filter = {
      course: { $in: courseIds },
      scope: "lesson",
      isPublished: true,
    };

    if (cursor) {
      const cursorDoc = await Quiz.findById(cursor).select("createdAt");

      if (cursorDoc) {
        filter.$or = [
          { createdAt: { $lt: cursorDoc.createdAt } },
          {
            createdAt: cursorDoc.createdAt,
            _id: { $lt: cursor },
          },
        ];
      }
    }

    const quizzes = await Quiz.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("lesson", "title slug")
      .populate("course", "title slug")
      .lean();

    const hasNext = quizzes.length > limit;

    if (hasNext) quizzes.pop();

    const lessonIds = quizzes.map((q) => q.lesson._id);

    const lessonProgress = await LessonProgress.find({
      student: student._id,
      lesson: { $in: lessonIds },
    }).lean();

    const progressMap = new Map(
      lessonProgress.map((lp) => [lp.lesson.toString(), lp])
    );

    const match = buildMyQuizMatcher(query);

    const data = [];

    for (const quiz of quizzes) {
      const lp = progressMap.get(quiz.lesson._id.toString());

      let status = "upcoming";

      if (lp) {
        // chưa học gì
        if (lp.status === "not_started") {
          status = "not-started";
        }

        // đang học
        else if (lp.status === "in_progress") {
          status = "in-progress";
        }

        // học xong nhưng chưa làm quiz
        else if (lp.status === "quiz_pending") {
          status = "pending";
        }

        // đã làm quiz
        else if (lp.quiz?.attempted) {
          status = lp.quiz.passed ? "completed" : "failed";
        }

        // fallback
        else {
          status = "pending";
        }
      }

      const card = {
        id: quiz._id.toString(),
        title: quiz.title,

        courseTitle: quiz.course.title,
        courseSlug: quiz.course.slug,

        lessonTitle: quiz.lesson.title,

        lessonSlug: quiz.lesson.slug,
        quizSlug: quiz.slug,

        status,

        progress: lp?.progress?.percent || 0,

        attempts: lp?.quiz?.attempts || 0,
        score: lp?.quiz?.score ?? null,

        createdAt: quiz.createdAt,
      };

      if (!match(card)) continue;

      data.push(card);
    }

    return {
      data,
      pagination: {
        nextCursor: hasNext ? data[data.length - 1]?.id : null,
        hasNext,
      },
    };
  },
  async getQuizOptions({ role, userId }) {
    try {
      const filter = {};

      if (role === ROLES.INSTRUCTOR) {
        const instructorDoc = await Instructor.findOne({
          user: userId,
        })
          .select("_id")
          .lean();

        if (!instructorDoc) return [];

        const courses = await Course.find({
          instructor: instructorDoc._id,
        })
          .select("_id")
          .lean();

        filter.course = {
          $in: courses.map((item) => item._id),
        };
      }

      if (role === ROLES.STUDENT) {
        const studentDoc = await Student.findOne({
          user: userId,
        })
          .select("enrolledCourses.course")
          .lean();

        if (!studentDoc) return [];

        filter.course = {
          $in: studentDoc.enrolledCourses.map((item) => item.course),
        };

        filter.isPublished = true;
      }

      const docs = await Quiz.find(filter)
        .select("_id title slug")
        .sort({ title: 1 })
        .lean();

      return docs.map((doc) => ({
        id: doc._id.toString(),
        name: doc.title,
        slug: doc.slug,
      }));
    } catch (err) {
      console.error("getQuizOptions error:", err);

      throw new AppError(
        QUIZ_CODES.QUIZ_LIST_FAILED,
        "Không thể lấy quiz options",
        500
      );
    }
  },
  async getQuizBySlug(slug) {
    return Quiz.findOne({ slug })
      .populate("course", "title slug")
      .populate({
        path: "createdBy",
        select: "slug bio",
        populate: { path: "user", select: "fullname avatar email" },
      })
      .populate("questions");
  },
  async findQuizzes(filter = {}) {
    return Quiz.find(filter)
      .sort({ _id: 1 })
      .populate("course", "title slug")
      .populate({
        path: "createdBy",
        select: "slug user",
        populate: { path: "user", select: "fullname avatar" },
      })
      .lean();
  },
  async getQuizById(id) {
    return Quiz.findById(id);
  },
  async updateQuiz(id, data, user) {
    try {
      // 1️⃣ validate id
      if (!id) {
        throw new AppError(QUIZ_CODES.QUIZ_ID_REQUIRED, "Thiếu id quiz", 400);
      }

      // 2️⃣ check tồn tại
      const oldDoc = await Quiz.findById(id);

      if (!oldDoc) {
        throw new AppError(
          QUIZ_CODES.QUIZ_NOT_FOUND,
          "Không tìm thấy quiz",
          404
        );
      }

      const oldMapped = mapQuiz(oldDoc);

      // 3️⃣ chuẩn hóa data
      const updateData = { ...data };

      if (updateData.title) {
        updateData.title = updateData.title.trim();
      }

      // instructor chỉ được sửa quiz của mình
      if (user.role === ROLES.INSTRUCTOR) {
        updateData.createdBy = user.id || user._id;
      }

      // 4️⃣ update
      const updatedDoc = await Quiz.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      const mapped = mapQuiz(updatedDoc);

      // 5️⃣ audit log trong service
      await saveAuditLogs({
        entityType: "quizzes",
        entityId: id,
        action: "update",
        oldData: oldMapped,
        newData: mapped,
        updatedBy: getUserIdentifier(user),
      });

      return mapped;
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("updateQuiz service error:", err);

      throw new AppError(
        QUIZ_CODES.QUIZ_UPDATE_FAILED,
        "Không thể cập nhật quiz",
        500
      );
    }
  },
  async deleteQuiz(id) {
    return Quiz.findByIdAndDelete(id);
  },

  // services/quiz.service.js
  async removeManyQuizzes(ids = [], actor) {
    try {
      // 1️⃣ validate ids
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError(
          QUIZ_CODES.QUIZ_DELETE_EMPTY_IDS,
          "Không có quiz để xóa",
          400
        );
      }

      // 2️⃣ lấy quiz tồn tại
      const quizzes = await Quiz.find({
        _id: { $in: ids },
      });

      // 3️⃣ check missing
      if (quizzes.length !== ids.length) {
        const foundIds = quizzes.map((q) => q._id.toString());

        const notFoundIds = ids.filter((id) => !foundIds.includes(id));

        throw new AppError(
          QUIZ_CODES.QUIZ_NOT_FOUND,
          `Không tìm thấy quiz: ${notFoundIds.join(", ")}`,
          404
        );
      }

      // 4️⃣ map old data
      const mappedOld = quizzes.map(mapQuiz);

      // 5️⃣ delete
      await Quiz.deleteMany({
        _id: { $in: ids },
      });

      // 6️⃣ audit log
      await Promise.all(
        quizzes.map((quiz, index) =>
          saveAuditLogs({
            entityType: "quizzes",
            entityId: quiz._id.toString(),
            action: "delete",
            oldData: mappedOld[index],
            newData: {},
            updatedBy: getUserIdentifier(actor),
          })
        )
      );

      // 7️⃣ return result chuẩn
      return {
        deletedIds: ids,
        deletedCount: ids.length,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("removeManyQuizzes service error:", err);

      throw new AppError(
        QUIZ_CODES.QUIZ_DELETE_FAILED,
        "Không thể xóa quiz",
        500
      );
    }
  },
  async getQuizzesForExport({ scope, selectedIds, filters = {}, search = "" }) {
    const query = {};

    // search
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    // courseId
    if (
      filters.courseId &&
      filters.courseId !== "all" &&
      mongoose.Types.ObjectId.isValid(filters.courseId)
    ) {
      query.course = filters.courseId;
    }

    // status -> map sang isPublished
    if (Array.isArray(filters.status) && filters.status.length > 0) {
      query.isPublished = {
        $in: filters.status.map((s) => s === "Published"),
      };
    }

    // SELECTED
    if (scope === "SELECTED") {
      query._id = { $in: selectedIds };
    }

    return Quiz.find(query)
      .populate("course")

      .populate("lesson")
      .sort({ createdAt: -1 })
      .lean();
  },
  async previewExportQuizzes({ payload }) {
    const { scope, selectedIds = [], filters = {}, search = "" } = payload;

    validateQuizExportScope({ scope, selectedIds });

    const quizzes = await this.getQuizzesForExport({
      scope,
      selectedIds,
      filters,
      search,
    });

    if (!quizzes.length) {
      throw new AppError(
        QUIZ_CODES.QUIZ_EXPORT_EMPTY,
        "Không có dữ liệu để xem trước",
        404
      );
    }

    const mapped = quizzes.map(mapQuiz);

    return {
      total: mapped.length,
      columns: Object.keys(mapped[0]),
      preview: mapped.slice(0, 10),
    };
  },

  async exportQuizzes({ payload, user }) {
    const { scope, selectedIds, filters, format } = payload;

    validateQuizExportScope({ scope, selectedIds });

    validateQuizExportFormat(format);

    const quizzes = await this.getQuizzesForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!quizzes.length) {
      throw new AppError(
        QUIZ_CODES.QUIZ_EXPORT_EMPTY,
        "Không có dữ liệu để export",
        404
      );
    }

    const buffer = await exportQuizzesFile({
      quizzes,
      format,
    });

    await saveAuditLogs({
      entityType: "quizzes",
      action: "export",
      entityId: null,
      oldData: {},
      newData: {
        count: quizzes.length,
        format,
      },
      updatedBy: user?.id || user?._id,
    });

    return {
      buffer,
      fileName: `quizzes_${Date.now()}.${format === "excel" ? "xlsx" : "pdf"}`,
      contentType:
        format === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
    };
  },
};

export default QuizServices;
