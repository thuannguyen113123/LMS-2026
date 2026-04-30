import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import Course from "../../models/courses/Course.js";
import Lesson from "../../models/lesson/lesson.model.js";
import Instructor from "../../models/instructor/instructor.model.js";

import mongoose from "mongoose";
import AppError from "../../utils/AppError.js";
import { LESSON_CODES } from "../../constants/lesson.codes.js";
import { ROLES } from "../../middlewares/auth.js";
import { lessonBulkItemSchema } from "../../validators/lesson/lesson.validator.js";
import slugify from "slugify";
import { exportLessonsFile } from "./lesson.export.js";

const getUserIdentifier = (user) => user?.email || user?.phone || "unknown";
export const mapLesson = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  let course = null;

  if (doc.course) {
    // nếu populate
    if (typeof doc.course === "object") {
      course = {
        id: doc.course._id?.toString(),
        title: doc.course.title,
        slug: doc.course.slug,
        instructor: doc.course.instructor,
      };
    }
    // nếu chỉ là ObjectId
    else {
      course = doc.course.toString();
    }
  }

  return {
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,

    course,

    content: doc.content,
    videoUrl: doc.videoUrl,

    order: doc.order,
    duration: doc.duration,

    isPublished: doc.isPublished,
    createdBy: doc.createdBy,
    updatedBy: doc.updatedBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

export const validateLessonExportScope = ({ scope, selectedIds }) => {
  if (!["ALL", "SELECTED", "CURRENT_PAGE"].includes(scope)) {
    throw new AppError(
      LESSON_CODES.LESSON_EXPORT_SCOPE_INVALID,
      "Phạm vi export lesson không hợp lệ",
      400
    );
  }

  if (scope === "SELECTED" && (!selectedIds || selectedIds.length === 0)) {
    throw new AppError(
      LESSON_CODES.LESSON_EXPORT_SELECTED_EMPTY,
      "Chưa chọn bài học để export",
      400
    );
  }
};

export const validateLessonExportFormat = (format) => {
  if (!["excel", "pdf"].includes(format)) {
    throw new AppError(
      LESSON_CODES.LESSON_EXPORT_FORMAT_INVALID,
      "Định dạng export không hợp lệ",
      400
    );
  }
};

export async function buildLessonFilter({
  query,
  courseSlug,
  role,
  userId,
  isPublic,
}) {
  const filter = {};
  let course = null;

  // ===== COURSE FROM SLUG (public / nested route) =====
  if (courseSlug) {
    course = await Course.findOne({ slug: courseSlug }).lean();

    if (!course) {
      throw new AppError(
        LESSON_CODES.LESSON_COURSE_NOT_FOUND,
        "Không tìm thấy khóa học",
        404
      );
    }

    filter.course = course._id || course.id;
  }

  // ===== COURSE FROM ADMIN FILTER (ID) =====
  if (query.course && query.course !== "all") {
    filter.course = query.course;
  }

  // ===== PUBLIC =====
  if (isPublic) {
    filter.isPublished = true;

    if (course && course.status !== "published") {
      throw new AppError(
        LESSON_CODES.LESSON_COURSE_NOT_PUBLISHED,
        "Khóa học chưa publish",
        403
      );
    }
  }

  // ===== STUDENT =====
  if (role === ROLES.STUDENT) {
    filter.isPublished = true;
  }

  // ===== INSTRUCTOR =====
  if (role === ROLES.INSTRUCTOR) {
    const instructorDoc = await Instructor.findOne({ user: userId }).lean();

    if (!instructorDoc) {
      throw new AppError(
        LESSON_CODES.LESSON_INSTRUCTOR_NOT_ALLOWED,
        "Không tìm thấy instructor",
        403
      );
    }

    if (filter.course) {
      const courseCheck = await Course.findById(filter.course).lean();

      if (courseCheck?.instructor.toString() !== instructorDoc._id.toString()) {
        throw new AppError(
          LESSON_CODES.LESSON_INSTRUCTOR_NOT_ALLOWED,
          "Không có quyền xem lesson",
          403
        );
      }
    } else {
      const courses = await Course.find({
        instructor: instructorDoc._id,
      })
        .select("_id")
        .lean();

      filter.course = {
        $in: courses.map((c) => c._id),
      };
    }
  }

  // ===== SEARCH =====
  if (query.search?.trim()) {
    filter.title = {
      $regex: query.search.trim(),
      $options: "i",
    };
  }

  // ===== TYPE =====
  if (query.type && query.type !== "all") {
    filter.type = query.type;
  }

  // ===== DURATION =====
  if (query.minDuration) {
    filter.duration = { $gte: Number(query.minDuration) };
  }

  if (query.maxDuration) {
    filter.duration = filter.duration || {};
    filter.duration.$lte = Number(query.maxDuration);
  }

  return filter;
}
export function applyLessonTypeFilter(filter, type) {
  if (!type) return filter;

  switch (type) {
    case "new":
      filter.createdAt = {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      };
      break;

    case "video":
    case "quiz":
    case "assignment":
      filter.type = type;
      break;
  }

  return filter;
}
export function buildLessonSort({ sort, type }) {
  if (type === "new") return { createdAt: -1, _id: -1 };

  switch (sort) {
    case "duration_asc":
      return { duration: 1, _id: 1 };

    case "duration_desc":
      return { duration: -1, _id: -1 };

    case "latest":
      return { createdAt: -1, _id: -1 };

    default:
      return { order: 1, _id: 1 };
  }
}

const LessonService = {
  // CREATE ONE
  async createLesson(data, user) {
    try {
      const title = data.title?.trim();

      if (!title) {
        throw new AppError(
          LESSON_CODES.LESSON_CREATE_FAILED,
          "Tiêu đề bài học không hợp lệ",
          400
        );
      }

      // ✅ check course tồn tại
      const course = await Course.findById(data.course).populate("instructor");
      if (!course) {
        throw new AppError(
          LESSON_CODES.LESSON_COURSE_NOT_FOUND,
          "Không tìm thấy khóa học",
          404
        );
      }

      // ✅ role rule — instructor chỉ tạo lesson trong course của mình
      if (user.role === ROLES.INSTRUCTOR) {
        const instructorDoc = await Instructor.findOne({ user: user.id });

        if (!instructorDoc) {
          throw new AppError(
            LESSON_CODES.LESSON_INSTRUCTOR_NOT_ALLOWED,
            "Không tìm thấy instructor",
            400
          );
        }

        if (course.instructor._id.toString() !== instructorDoc._id.toString()) {
          throw new AppError(
            LESSON_CODES.LESSON_INSTRUCTOR_NOT_ALLOWED,
            "Instructor không có quyền tạo lesson cho khóa học này",
            403
          );
        }
      }

      // ✅ duplicate slug trong course
      if (data.slug) {
        const existed = await Lesson.findOne({
          slug: data.slug,
          course: data.course,
        });

        if (existed) {
          throw new AppError(
            LESSON_CODES.LESSON_EXISTS,
            "Lesson đã tồn tại",
            409
          );
        }
      }

      // ✅ create
      const created = await Lesson.create({
        ...data,
        title,
        createdBy: user.id || user._id,
        updatedBy: user.id || user._id,
      });

      const mapped = mapLesson(created);

      // ✅ audit log trong service
      await saveAuditLogs({
        entityType: "lessons",
        entityId: created._id,
        action: "create",
        oldData: {},
        newData: mapped,
        updatedBy: user.id || user._id,
      });

      // ✅ trả mapped object
      return mapped;
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("CreateLesson service error:", err);
      throw err;
    }
  },
  // CREATE MANY
  async bulkCreateLessons(inputList = [], user) {
    if (!Array.isArray(inputList) || inputList.length === 0) {
      throw new AppError(
        LESSON_CODES.LESSON_BULK_INVALID_PAYLOAD,
        "Danh sách lesson không hợp lệ"
      );
    }

    const errors = [];
    const validItems = [];

    // =========================
    // 1️⃣ VALIDATE ROW
    // =========================
    inputList.forEach((item, index) => {
      const { error, value } = lessonBulkItemSchema.validate(item, {
        abortEarly: false,
      });

      if (error) {
        errors.push({
          index,
          code: LESSON_CODES.LESSON_BULK_VALIDATION_FAILED,
          title: item?.title || null,
          reason: error.details.map((d) => d.message),
        });
      } else {
        validItems.push(value);
      }
    });

    // =========================
    // 2️⃣ DUPLICATE TITLE IN FILE (per course)
    // =========================
    const seen = new Set();
    const uniqueValid = [];

    validItems.forEach((item) => {
      const key = `${item.courseSlug}|${item.title}`.toLowerCase();

      if (seen.has(key)) {
        errors.push({
          code: LESSON_CODES.LESSON_BULK_DUPLICATE_IN_FILE,
          title: item.title,
          reason: ["Trùng lesson trong file import"],
        });
      } else {
        seen.add(key);
        uniqueValid.push(item);
      }
    });

    // =========================
    // 3️⃣ MAP courseSlug → courseId
    // =========================
    const slugs = [...new Set(uniqueValid.map((i) => i.courseSlug))];

    const courses = await Course.find({
      slug: { $in: slugs },
    })
      .select("_id slug instructor")
      .lean();

    const courseMap = new Map(courses.map((c) => [c.slug, c]));

    // =========================
    // 4️⃣ INSTRUCTOR SCOPE CHECK
    // =========================
    let instructorDoc = null;

    if (user.role === ROLES.INSTRUCTOR) {
      instructorDoc = await Instructor.findOne({ user: user.id }).lean();
      if (!instructorDoc) {
        throw new AppError(
          LESSON_CODES.LESSON_INSTRUCTOR_NOT_ALLOWED,
          "Không tìm thấy instructor"
        );
      }
    }

    const mappedItems = [];

    uniqueValid.forEach((item, index) => {
      const course = courseMap.get(item.courseSlug);

      if (!course) {
        errors.push({
          index,
          code: LESSON_CODES.LESSON_COURSE_NOT_FOUND,
          title: item.title,
          reason: [`Course "${item.courseSlug}" không tồn tại`],
        });
        return;
      }

      // 🔐 instructor chỉ import lesson course của mình
      if (
        user.role === ROLES.INSTRUCTOR &&
        course.instructor.toString() !== instructorDoc._id.toString()
      ) {
        errors.push({
          index,
          code: LESSON_CODES.LESSON_INSTRUCTOR_NOT_ALLOWED,
          title: item.title,
          reason: ["Không thuộc khóa học của instructor"],
        });
        return;
      }

      mappedItems.push({
        title: item.title,
        slug: slugify(item.title, { lower: true, strict: true }),

        content: item.content,
        videoUrl: item.videoUrl,

        order: item.order,
        duration: item.duration,
        isPublished: item.isPublished ?? false,

        course: course._id,

        createdBy: user.id,
        updatedBy: user.id,
      });
    });

    // =========================
    // 5️⃣ CHECK DUPLICATE DB (slug + course)
    // =========================
    const existing = await Lesson.find({
      $or: mappedItems.map((i) => ({
        slug: i.slug,
        course: i.course,
      })),
    })
      .select("slug course")
      .lean();

    const existSet = new Set(existing.map((e) => `${e.course}|${e.slug}`));

    const toCreate = [];
    const skipped = [];

    mappedItems.forEach((item) => {
      const key = `${item.course}|${item.slug}`;

      if (existSet.has(key)) {
        skipped.push({
          code: LESSON_CODES.LESSON_ALREADY_EXISTS,
          title: item.title,
        });
      } else {
        toCreate.push(item);
      }
    });

    if (toCreate.length === 0) {
      return {
        created: [],
        skipped,
        errors,
        summary: {
          total: inputList.length,
          created: 0,
          skipped: skipped.length,
          failed: errors.length,
        },
      };
    }

    // =========================
    // 6️⃣ INSERT
    // =========================
    const createdDocs = await Lesson.insertMany(toCreate, {
      ordered: false,
    });

    // =========================
    // 7️⃣ AUDIT LOG
    // =========================
    await Promise.all(
      createdDocs.map((doc) =>
        saveAuditLogs({
          entityType: "lessons",
          entityId: doc._id,
          oldData: {},
          newData: mapLesson(doc),
          updatedBy: user.id,
        })
      )
    );

    return {
      created: createdDocs.map(mapLesson),
      skipped,
      errors,
      summary: {
        total: inputList.length,
        created: createdDocs.length,
        skipped: skipped.length,
        failed: errors.length,
      },
    };
  },

  // LIST LESSONS (đầy đủ filter/sort/pagination như Course)
  async listAdminLessonsUseCase({ query, courseSlug, role, userId }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const skip = (page - 1) * limit;

    let filter = await buildLessonFilter({
      query,
      courseSlug,
      role,
      userId,
    });

    const sort = buildLessonSort({
      sort: query.sort,
      type: query.type,
    });

    const [docs, total] = await Promise.all([
      Lesson.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("course", "title slug instructor")
        .lean(),

      Lesson.countDocuments(filter),
    ]);

    return {
      data: docs.map(mapLesson),

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
  async listPublicLessonsUseCase({ query, courseSlug, isPublic }) {
    const limit = Number(query.limit) || 10;
    const cursor = query.cursor;

    let filter = await buildLessonFilter({
      query,
      courseSlug,
      isPublic,
    });

    if (cursor) {
      const cursorDoc = await Lesson.findById(cursor).select("createdAt");

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

    const docs = await Lesson.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate("course", "title slug instructor")
      .lean();

    const hasNext = docs.length > limit;

    if (hasNext) docs.pop();

    const data = docs.map(mapLesson);

    return {
      data,

      pagination: {
        nextCursor: hasNext ? data[data.length - 1].id : null,
        hasNext,
      },
    };
  },

  // GET DETAIL
  async getLessonById(id) {
    const lesson = await Lesson.findById(id)
      .populate("course", "title slug thumbnail")
      .lean();

    return lesson;
  },
  // UPDATE LESSON — ADMIN / INSTRUCTOR
  async updateLesson(id, data, user) {
    try {
      if (!id) {
        throw new AppError(
          LESSON_CODES.LESSON_ID_REQUIRED,
          "Thiếu id bài học",
          400
        );
      }

      // 1️⃣ check tồn tại
      const oldDoc = await Lesson.findById(id).populate("course");
      if (!oldDoc) {
        throw new AppError(
          LESSON_CODES.LESSON_NOT_FOUND,
          "Không tìm thấy bài học",
          404
        );
      }

      const oldMapped = mapLesson(oldDoc);

      // ========================================================
      // 2️⃣ ROLE RULE — instructor chỉ update lesson của course mình
      // ========================================================
      if (user.role === ROLES.INSTRUCTOR) {
        const instructorDoc = await Instructor.findById(
          oldDoc.course.instructor
        ).lean();

        if (!instructorDoc) {
          throw new AppError(
            LESSON_CODES.LESSON_FORBIDDEN,
            "Instructor không hợp lệ",
            403
          );
        }

        const ownerUserId = instructorDoc.user.toString();
        const currentUserId = (user.id || user._id).toString();

        if (ownerUserId !== currentUserId) {
          throw new AppError(
            LESSON_CODES.LESSON_FORBIDDEN,
            "Bạn không có quyền cập nhật bài học này",
            403
          );
        }
      }

      // ========================================================
      // 3️⃣ normalize data
      // ========================================================
      const updateData = { ...data };

      if (updateData.title) {
        updateData.title = updateData.title.trim();
      }

      // ========================================================
      // 4️⃣ slug duplicate check (nếu có slug)
      // ========================================================
      if (updateData.slug && updateData.slug !== oldDoc.slug) {
        const existed = await Lesson.findOne({
          slug: updateData.slug,
          _id: { $ne: id },
        });

        if (existed) {
          throw new AppError(
            LESSON_CODES.LESSON_EXISTS,
            "Slug bài học đã tồn tại",
            409
          );
        }
      }

      // ========================================================
      // 5️⃣ instructor không được đổi course
      // admin thì cho nếu cần
      // ========================================================
      if (user.role === ROLES.INSTRUCTOR && updateData.course) {
        updateData.course = oldDoc.course._id;
      }

      // ========================================================
      // 6️⃣ updatedBy
      // ========================================================
      updateData.updatedBy = user.id || user._id;

      // ========================================================
      // 7️⃣ update
      // ========================================================
      const updatedDoc = await Lesson.findByIdAndUpdate(id, updateData, {
        new: true,
      }).populate("course");

      const mapped = mapLesson(updatedDoc);

      // ========================================================
      // 8️⃣ audit log — trong service (giống course)
      // ========================================================
      await saveAuditLogs({
        entityType: "lessons",
        entityId: id,
        action: "update",
        oldData: oldMapped,
        newData: mapped,
        updatedBy: getUserIdentifier(user),
      });

      return mapped;
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("updateLesson service error:", err);

      throw new AppError(
        LESSON_CODES.LESSON_UPDATE_FAILED,
        "Không thể cập nhật bài học",
        500
      );
    }
  },

  // DELETE ONE
  async deleteLesson(id) {
    await Lesson.findByIdAndDelete(id);
    return true;
  },

  // DELETE MANY
  async removeManyLessons(ids = [], actor) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError(
        LESSON_CODES.LESSON_DELETE_EMPTY_IDS,
        "Không có bài học để xóa",
        400
      );
    }

    // 1️⃣ Lấy data cũ
    const lessons = await Lesson.find({ _id: { $in: ids } });

    if (lessons.length !== ids.length) {
      const foundIds = lessons.map((l) => l._id.toString());
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      throw new AppError(
        LESSON_CODES.LESSON_NOT_FOUND,
        `Không tìm thấy bài học: ${notFoundIds.join(", ")}`,
        404
      );
    }

    // 2️⃣ Map old data
    const mappedOld = lessons.map(mapLesson);

    // 3️⃣ Delete
    await Lesson.deleteMany({ _id: { $in: ids } });

    // 4️⃣ Audit log — trong service (chuẩn style mới)
    await Promise.all(
      lessons.map((lesson, index) =>
        saveAuditLogs({
          entityType: "lessons",
          entityId: lesson._id,
          action: "delete",
          oldData: mappedOld[index],
          newData: {},
          updatedBy: actor?.id || actor?._id,
        })
      )
    );

    // 5️⃣ Return result chuẩn
    return {
      deletedIds: ids,
      deletedCount: ids.length,
    };
  },

  async getLessonsForExport({ scope, selectedIds, filters }) {
    const query = {};

    if (filters?.search) {
      query.title = { $regex: filters.search, $options: "i" };
    }

    if (filters?.course && mongoose.Types.ObjectId.isValid(filters.course)) {
      query.course = filters.course;
    }

    if (typeof filters?.isPublished === "boolean") {
      query.isPublished = filters.isPublished;
    }

    if (scope === "SELECTED") {
      query._id = { $in: selectedIds };
    }

    return Lesson.find(query)
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .lean();
  },
  async previewExportLessons({ payload }) {
    const { scope, selectedIds = [], filters = {} } = payload;

    validateLessonExportScope({ scope, selectedIds });

    const lessons = await this.getLessonsForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!lessons.length) {
      throw new AppError(
        LESSON_CODES.LESSON_EXPORT_EMPTY,
        "Không có dữ liệu để xem trước",
        404
      );
    }

    const mapped = lessons.map(mapLesson);

    return {
      total: mapped.length,
      columns: Object.keys(mapped[0]),
      preview: mapped.slice(0, 10),
    };
  },
  async exportLessons({ payload, user }) {
    const { scope, selectedIds, filters, format } = payload;

    validateLessonExportScope({ scope, selectedIds });
    validateLessonExportFormat(format);

    const lessons = await this.getLessonsForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!lessons.length) {
      throw new AppError(
        LESSON_CODES.LESSON_EXPORT_EMPTY,
        "Không có dữ liệu để export",
        404
      );
    }

    const buffer = await exportLessonsFile({
      lessons,
      format,
    });

    await saveAuditLogs({
      entityType: "lessons",
      action: "export",
      entityId: null,
      oldData: {},
      newData: { count: lessons.length, format },
      updatedBy: user?.id || user?._id,
    });

    return {
      buffer,
      fileName: `lessons_${Date.now()}.${format === "excel" ? "xlsx" : "pdf"}`,
      contentType:
        format === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
    };
  },
};

export default LessonService;
