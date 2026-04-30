import { STUDENT_CODES } from "../../constants/student.codes.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import Student from "../../models/student/student.model.js";
import Instructor from "../../models/instructor/instructor.model.js";
import User from "../../models/user/user.model.js";
import mongoose from "mongoose";

import AppError from "../../utils/AppError.js";
import { studentBulkItemSchema } from "../../validators/student/student.validator.js";
import { exportStudentsFile, mapStudentExportData } from "./student.export.js";

export const mapStudent = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  return {
    id: doc._id?.toString(),
    user: doc.user,

    slug: doc.slug,

    enrolledCourses: doc.enrolledCourses || [],
    bookmarks: doc.bookmarks || [],
    certificates: doc.certificates || [],

    preferences: doc.preferences || {
      language: "vi",
      notifications: true,
      darkMode: false,
    },

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

export const validateStudentExportScope = ({ scope, selectedIds }) => {
  if (!["ALL", "SELECTED", "CURRENT_PAGE"].includes(scope)) {
    throw new AppError(
      STUDENT_CODES.STUDENT_EXPORT_SCOPE_INVALID,
      "Phạm vi export không hợp lệ",
      400
    );
  }

  if (scope === "SELECTED" && (!selectedIds || selectedIds.length === 0)) {
    throw new AppError(
      STUDENT_CODES.STUDENT_EXPORT_SELECTED_EMPTY,
      "Chưa chọn học sinh để export",
      400
    );
  }
};

export const validateStudentExportFormat = (format) => {
  if (!["excel", "pdf"].includes(format)) {
    throw new AppError(
      STUDENT_CODES.STUDENT_EXPORT_FORMAT_INVALID,
      "Định dạng export không hợp lệ",
      400
    );
  }
};

export function buildStudentFilter(query = {}) {
  const { search, language, darkMode, notifications } = query;

  const filter = {};

  if (typeof search === "string") {
    const cleanSearch = search
      .replace(/\s+/g, " ") // remove tab/newline/multi space
      .trim();

    if (cleanSearch.length > 0) {
      filter.$or = [
        { slug: { $regex: cleanSearch, $options: "i" } },
        { "user.fullname": { $regex: cleanSearch, $options: "i" } },
      ];
    }
  }

  /**
   * 🌐 language
   */
  if (language && language !== "all") {
    const langs = language.split(",").map((x) => x.trim());
    filter["preferences.language"] = { $in: langs };
  }

  /**
   * 🌙 darkMode
   */
  if (darkMode === "true" || darkMode === "false") {
    filter["preferences.darkMode"] = darkMode === "true";
  }

  /**
   * 🔔 notifications
   */
  if (notifications === "true" || notifications === "false") {
    filter["preferences.notifications"] = notifications === "true";
  }

  return filter;
}
export function buildStudentSort(sort) {
  switch (sort) {
    case "courses_desc":
      return { enrolledCoursesCount: -1, _id: -1 };

    case "oldest":
      return { createdAt: 1, _id: 1 };

    case "latest":
    default:
      return { createdAt: -1, _id: -1 };
  }
}

async function recalcInstructorRating(instructorId) {
  const objectId = new mongoose.Types.ObjectId(instructorId);

  const result = await Student.aggregate([
    {
      $match: {
        "instructorRatings.instructor": objectId,
      },
    },

    { $unwind: "$instructorRatings" },

    {
      $match: {
        "instructorRatings.instructor": objectId,
      },
    },

    {
      $group: {
        _id: "$instructorRatings.instructor",
        avg: { $avg: "$instructorRatings.rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = result[0] ?? { avg: 0, count: 0 };

  await Instructor.findByIdAndUpdate(instructorId, {
    "rating.average": Number(stats.avg.toFixed(2)),
    "rating.count": stats.count,
  });
}
async function resolveInstructorId(userId) {
  const instructor = await Instructor.findOne({ user: userId }).select("_id");

  if (!instructor) {
    throw new AppError(
      STUDENT_CODES.INSTRUCTOR_NOT_FOUND,
      "Instructor profile không tồn tại",
      404
    );
  }

  return instructor._id;
}

const StudentModel = {
  async createStudent(data, user) {
    try {
      // rule: user phải tồn tại
      const userDoc = await User.findById(data.user);
      if (!userDoc) {
        throw new AppError(
          STUDENT_CODES.STUDENT_USER_NOT_FOUND,
          "Không tìm thấy user",
          404
        );
      }

      // duplicate check (nếu cần)
      const existed = await Student.findOne({ user: data.user });
      if (existed) {
        throw new AppError(
          STUDENT_CODES.STUDENT_EXISTS,
          "Student đã tồn tại",
          409
        );
      }

      const created = await Student.create({
        ...data,

        createdBy: user?.id || user?._id,
        updatedBy: user?.id || user?._id,
      });

      const student = mapStudent(created);

      // audit
      await saveAuditLogs({
        entityType: "students",
        entityId: created._id,
        action: "create",
        oldData: {},
        newData: student,
        updatedBy: user?.id || user?._id,
      });

      return student;
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("CreateStudent service error:", err);
      throw err;
    }
  },
  async bulkCreateStudents(inputList = [], updatedBy) {
    if (!Array.isArray(inputList) || inputList.length === 0) {
      throw new AppError(
        STUDENT_CODES.STUDENT_BULK_INVALID_PAYLOAD,
        "Danh sách student không hợp lệ"
      );
    }

    const validItems = [];
    const errors = [];

    // 1️⃣ validate từng dòng
    inputList.forEach((item, index) => {
      const { error, value } = studentBulkItemSchema.validate(item, {
        abortEarly: false,
      });

      if (error) {
        errors.push({
          index,
          code: STUDENT_CODES.STUDENT_BULK_VALIDATION_FAILED,
          email: item?.userEmail || null,
          reason: error.details.map((d) => d.message),
        });
      } else {
        validItems.push(value);
      }
    });

    // 2️⃣ duplicate email trong file
    const seen = new Set();
    const uniqueValid = [];

    validItems.forEach((item) => {
      const key = item.userEmail.toLowerCase();

      if (seen.has(key)) {
        errors.push({
          code: STUDENT_CODES.STUDENT_BULK_DUPLICATE_IN_FILE,
          email: item.userEmail,
          reason: ["Trùng userEmail trong file"],
        });
      } else {
        seen.add(key);
        uniqueValid.push(item);
      }
    });

    // 3️⃣ map userEmail → userId
    const emails = uniqueValid.map((i) => i.userEmail.toLowerCase());

    const users = await User.find({
      email: { $in: emails },
    })
      .select("_id email")
      .lean();

    const userMap = new Map(users.map((u) => [u.email.toLowerCase(), u._id]));

    // 4️⃣ build create items
    const mappedItems = [];

    uniqueValid.forEach((item, index) => {
      const userId = userMap.get(item.userEmail.toLowerCase());

      if (!userId) {
        errors.push({
          index,
          code: STUDENT_CODES.STUDENT_USER_NOT_FOUND,
          email: item.userEmail,
          reason: ["User không tồn tại"],
        });
        return;
      }

      mappedItems.push({
        user: userId,
        preferences: {
          language: item.language ?? "vi",
          notifications: item.notifications ?? true,
          darkMode: item.darkMode ?? false,
        },
        createdBy: updatedBy,
        updatedBy,
      });
    });

    // 5️⃣ check student đã tồn tại (unique user)
    const userIds = mappedItems.map((i) => i.user);

    const existing = await Student.find({
      user: { $in: userIds },
    })
      .select("user")
      .lean();

    const existSet = new Set(existing.map((e) => e.user.toString()));

    const toCreate = [];
    const skipped = [];

    mappedItems.forEach((item) => {
      if (existSet.has(item.user.toString())) {
        skipped.push({
          code: STUDENT_CODES.STUDENT_ALREADY_EXISTS,
          user: item.user.toString(),
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

    // 6️⃣ insert
    const createdDocs = await Student.insertMany(toCreate, {
      ordered: false,
    });

    console.log("📧 Emails from file:", emails);
    console.log("👤 Users found:", users);
    console.log("🗺 userMap:", userMap);
    console.log("📚 Existing students:", existing);
    console.log("🧾 existSet:", existSet);

    // 7️⃣ audit
    await Promise.all(
      createdDocs.map((s) =>
        saveAuditLogs({
          entityType: "students",
          entityId: s._id,
          oldData: {},
          newData: mapStudent(s),
          updatedBy,
        })
      )
    );
    console.log("🧑 updatedBy:", updatedBy);
    console.log("typeof updatedBy:", typeof updatedBy);
    return {
      created: createdDocs.map(mapStudent),
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

  async getStudentById(id) {
    const student = await Student.findById(id)
      .populate("user", "fullname email")
      .populate("enrolledCourses.course", "title category price")
      .populate("bookmarks.course", "title")
      .populate("certificates.course", "title")
      .lean();
    return student || null;
  },

  async getStudentBySlug(slug) {
    const student = await Student.findOne({ slug })
      .populate("user", "fullname email")
      .populate("enrolledCourses.course", "title category price")
      .populate("bookmarks.course", "title")
      .populate("certificates.course", "title")
      .lean();
    return student || null;
  },

  async listAdminStudentsUseCase({ query }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = buildStudentFilter(query);
    const sort = buildStudentSort(query.sort);

    const [students, total] = await Promise.all([
      Student.find(filter)
        .populate("user", "fullname email phone")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      Student.countDocuments(filter),
    ]);

    return {
      data: students.map(mapStudent),

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
  async listPublicStudentsUseCase({ query }) {
    const limit = Number(query.limit) || 12;
    const cursor = query.cursor;

    let filter = buildStudentFilter(query);

    if (cursor) {
      const cursorDoc = await Student.findById(cursor).select("createdAt");

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

    const docs = await Student.find(filter)
      .populate("user", "fullname email phone")
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasNext = docs.length > limit;

    if (hasNext) docs.pop();

    const data = docs.map(mapStudent);

    return {
      data,

      pagination: {
        nextCursor: hasNext ? data[data.length - 1].id : null,
        hasNext,
      },
    };
  },

  async rateInstructor({ userId, instructorId, rating }) {
    if (rating < 1 || rating > 5) {
      throw new AppError(
        STUDENT_CODES.INSTRUCTOR_RATING_INVALID,
        "Rating phải từ 1-5",
        400
      );
    }

    // ⭐ convert USER_ID → INSTRUCTOR_ID
    const realInstructorId = await resolveInstructorId(instructorId);

    const student = await Student.findOne({ user: userId });

    if (!student)
      throw new AppError(
        STUDENT_CODES.STUDENT_NOT_FOUND,
        "Student profile không tồn tại",
        404
      );

    const existing = student.instructorRatings.find(
      (r) => r.instructor.toString() === realInstructorId.toString()
    );

    if (existing) {
      existing.rating = rating;
    } else {
      student.instructorRatings.push({
        instructor: realInstructorId,
        rating,
      });
    }

    await student.save();

    await recalcInstructorRating(realInstructorId);

    return true;
  },
  async removeInstructorRating({ userId, instructorId }) {
    const realInstructorId = await resolveInstructorId(instructorId);

    const student = await Student.findOneAndUpdate(
      { user: userId },
      {
        $pull: {
          instructorRatings: {
            instructor: realInstructorId,
          },
        },
      },
      { new: true }
    );

    if (!student) {
      throw new AppError(
        STUDENT_CODES.STUDENT_NOT_FOUND,
        "Student không tồn tại",
        404
      );
    }

    await recalcInstructorRating(realInstructorId);

    return true;
  },

  async getStudentByUserId(userId) {
    const student = await Student.findOne({ user: userId })
      .populate("user", "fullname email")
      .lean();
    return student || null;
  },

  async updateStudent(id, updateData) {
    const updated = await Student.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate("user", "fullname email")
      .lean();
    return updated || null;
  },

  async updateStudentBySlug(slug, updateData) {
    const updated = await Student.findOneAndUpdate({ slug }, updateData, {
      new: true,
    })
      .populate("user", "fullname email")
      .lean();
    return updated || null;
  },

  async enrollCourse({ studentId, courseId }) {
    const course = await Course.findById(courseId);
    if (!course) throw new Error("Course not found");

    const updated = await Student.findByIdAndUpdate(
      studentId,
      {
        $addToSet: {
          enrolledCourses: { course: courseId, enrolledAt: new Date() },
        },
      },
      { new: true }
    )
      .populate("enrolledCourses.course", "title category")
      .lean();

    return updated;
  },

  async updateCourseProgress({ studentId, courseId, progress }) {
    const student = await Student.findOneAndUpdate(
      {
        _id: studentId,
        "enrolledCourses.course": courseId,
      },
      {
        $set: {
          "enrolledCourses.$.progress": progress,
          "enrolledCourses.$.lastAccessed": new Date(),
          "enrolledCourses.$.completed": progress >= 100,
        },
      },
      { new: true }
    )
      .populate("enrolledCourses.course", "title")
      .lean();

    return student;
  },

  async addBookmark({ studentId, courseId }) {
    const updated = await Student.findByIdAndUpdate(
      studentId,
      {
        $addToSet: {
          bookmarks: { course: courseId, addedAt: new Date() },
        },
      },
      { new: true }
    )
      .populate("bookmarks.course", "title")
      .lean();

    return updated;
  },

  async removeBookmark({ studentId, courseId }) {
    const updated = await Student.findByIdAndUpdate(
      studentId,
      {
        $pull: { bookmarks: { course: courseId } },
      },
      { new: true }
    )
      .populate("bookmarks.course", "title")
      .lean();

    return updated;
  },

  async addCertificate({ studentId, courseId, certificateUrl }) {
    const updated = await Student.findByIdAndUpdate(
      studentId,
      {
        $addToSet: {
          certificates: {
            course: courseId,
            issuedAt: new Date(),
            certificateUrl,
          },
        },
      },
      { new: true }
    )
      .populate("certificates.course", "title")
      .lean();

    return updated;
  },

  async deleteStudent(id) {
    await Student.findByIdAndDelete(id);
    return true;
  },

  async removeManyStudents(ids = [], actor) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError(
        STUDENT_CODES.STUDENT_DELETE_EMPTY_IDS,
        "Không có học sinh để xóa",
        400
      );
    }

    // lấy data cũ
    const students = await Student.find({ _id: { $in: ids } });

    if (students.length !== ids.length) {
      const foundIds = students.map((s) => s._id.toString());
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      throw new AppError(
        STUDENT_CODES.STUDENT_NOT_FOUND,
        `Không tìm thấy học sinh: ${notFoundIds.join(", ")}`,
        404
      );
    }

    const mappedOld = students.map(mapStudent);

    // delete
    await Student.deleteMany({ _id: { $in: ids } });

    // audit log trong service luôn
    await Promise.all(
      students.map((student, index) =>
        saveAuditLogs({
          entityType: "students",
          entityId: student._id,
          action: "delete",
          oldData: mappedOld[index],
          newData: {},
          updatedBy: actor?.id || actor?._id,
        })
      )
    );

    return {
      deletedIds: ids,
      deletedCount: ids.length,
    };
  },

  async getStudentStats(studentId) {
    const student = await Student.findById(studentId)
      .populate("enrolledCourses.course", "title price")
      .lean();

    if (!student) return null;

    const totalCourses = student.enrolledCourses.length;
    const completedCourses = student.enrolledCourses.filter(
      (c) => c.completed
    ).length;
    const progressAvg =
      student.enrolledCourses.length > 0
        ? student.enrolledCourses.reduce((a, c) => a + c.progress, 0) /
          student.enrolledCourses.length
        : 0;

    return {
      totalCourses,
      completedCourses,
      progressAvg,
      bookmarksCount: student.bookmarks.length,
      certificatesCount: student.certificates.length,
    };
  },
  async getStudentsForExport({ scope, selectedIds, filters }) {
    const query = {};

    if (filters?.search) {
      query.code = { $regex: filters.search, $options: "i" };
    }

    if (filters?.status?.length) {
      query.status = { $in: filters.status };
    }

    if (scope === "SELECTED") {
      query._id = { $in: selectedIds };
    }

    return Student.find(query)
      .populate("user", "fullname email phone")
      .sort({ createdAt: -1 })
      .lean();
  },
  async previewExportStudents({ payload }) {
    const { scope, selectedIds = [], filters = {} } = payload;

    validateStudentExportScope({ scope, selectedIds });

    const students = await this.getStudentsForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!students.length) {
      throw new AppError(
        STUDENT_CODES.STUDENT_EXPORT_EMPTY,
        "Không có dữ liệu để xem trước",
        404
      );
    }

    const mapped = mapStudentExportData(students);

    return {
      total: mapped.length,
      columns: Object.keys(mapped[0]),
      preview: mapped.slice(0, 10),
    };
  },
  async exportStudents({ payload, user }) {
    const { scope, selectedIds, filters, format } = payload;

    validateStudentExportScope({ scope, selectedIds });
    validateStudentExportFormat(format);

    const students = await this.getStudentsForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!students.length) {
      throw new AppError(
        STUDENT_CODES.STUDENT_EXPORT_EMPTY,
        "Không có dữ liệu để export",
        404
      );
    }

    const buffer = await exportStudentsFile({
      students,
      format,
    });

    await saveAuditLogs({
      entityType: "students",
      action: "export",
      entityId: null,
      oldData: {},
      newData: { count: students.length, format },
      updatedBy: user?.id || user?._id,
    });

    return {
      buffer,
      fileName: `students_${Date.now()}.${format === "excel" ? "xlsx" : "pdf"}`,
      contentType:
        format === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
    };
  },
};

export default StudentModel;
