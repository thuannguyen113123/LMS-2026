import Student from "../../models/student/student.model.js";
import AppError from "../../utils/AppError.js";
import { STUDENT_CODES } from "../../constants/student.codes.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import mongoose from "mongoose";
export const mapBookmark = (doc) => {
  if (!doc?.course) return null;

  const c = doc.course;

  return {
    id: doc._id?.toString?.(),

    addedAt: doc.addedAt,

    course: {
      id: c._id.toString(),
      title: c.title,
      slug: c.slug,
      coverImage: c.coverImage,
      description: c.description,

      price: c.price,
      discountPrice: c.discountPrice,
      isFree: c.isFree,

      rating: c.ratingAverage || 0,
      duration: c.duration || 0,

      category: c.category
        ? {
            id: c.category._id.toString(),
            name: c.category.name,
            slug: c.category.slug,
          }
        : null,
    },
  };
};

const StudentBookmarkService = {
  async getBookmarksUseCase({ userId, query }) {
    const limit = Number(query.limit) || 12;
    const cursor = query.cursor;

    const student = await Student.findOne({ user: userId }).select("_id");

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    const matchStage = {
      $match: {
        _id: student._id,
      },
    };

    const pipeline = [
      matchStage,

      // bóc mảng bookmarks
      { $unwind: "$bookmarks" },

      // cursor pagination
      ...(cursor
        ? [
            {
              $match: {
                "bookmarks._id": { $lt: new mongoose.Types.ObjectId(cursor) },
              },
            },
          ]
        : []),

      // sort mới nhất
      {
        $sort: {
          "bookmarks.addedAt": -1,
        },
      },

      // lấy dư 1 để check hasNext
      {
        $limit: limit + 1,
      },

      // populate course
      {
        $lookup: {
          from: "courses",
          localField: "bookmarks.course",
          foreignField: "_id",
          as: "course",
        },
      },

      { $unwind: "$course" },

      // category
      {
        $lookup: {
          from: "categories",
          localField: "course.category",
          foreignField: "_id",
          as: "category",
        },
      },

      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },

      // reshape
      {
        $project: {
          _id: "$bookmarks._id",
          addedAt: "$bookmarks.addedAt",

          course: {
            _id: "$course._id",
            title: "$course.title",
            slug: "$course.slug",
            coverImage: "$course.coverImage",
            description: "$course.description",
            price: "$course.price",
            discountPrice: "$course.discountPrice",
            isFree: "$course.isFree",
            ratingAverage: "$course.ratingAverage",
            duration: "$course.duration",
            category: {
              _id: "$category._id",
              name: "$category.name",
              slug: "$category.slug",
            },
          },
        },
      },
    ];

    const docs = await Student.aggregate(pipeline);

    const hasNext = docs.length > limit;

    if (hasNext) docs.pop();

    const data = docs.map(mapBookmark);

    return {
      data,
      pagination: {
        nextCursor: hasNext ? data[data.length - 1].id : null,
        hasNext,
      },
    };
  },

  /** =================================================
   * ➕ ADD BOOKMARK
   * ================================================= */
  async addBookmark(userId, courseId, actor) {
    const student = await Student.findOne({ user: userId });

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    const exists = student.bookmarks.some(
      (b) => b.course.toString() === courseId
    );

    if (exists) {
      throw new AppError(
        "Already bookmarked",
        400,
        STUDENT_CODES.BOOKMARK_ALREADY_EXISTS
      );
    }

    const oldData = student.bookmarks.map(mapBookmark);

    student.bookmarks.push({
      course: courseId,
      addedAt: new Date(),
    });

    await student.save();

    const newData = student.bookmarks.map(mapBookmark);

    // ✅ audit log
    await saveAuditLogs({
      entityType: "student_bookmarks",
      entityId: student._id,
      action: "add_bookmark",
      oldData,
      newData,
      updatedBy: actor?.id || actor?._id,
    });

    return {
      code: STUDENT_CODES.BOOKMARK_ADDED,
      bookmarks: newData,
    };
  },

  /** =================================================
   * ➖ REMOVE BOOKMARK
   * ================================================= */
  async removeBookmark(userId, courseId, actor) {
    const student = await Student.findOne({ user: userId });

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    const oldData = student.bookmarks.map(mapBookmark);

    const before = student.bookmarks.length;

    student.bookmarks = student.bookmarks.filter(
      (b) => b.course.toString() !== courseId
    );

    if (before === student.bookmarks.length) {
      throw new AppError(
        "Bookmark not found",
        404,
        STUDENT_CODES.BOOKMARK_NOT_FOUND
      );
    }

    await student.save();

    const newData = student.bookmarks.map(mapBookmark);

    // ✅ audit log
    await saveAuditLogs({
      entityType: "student_bookmarks",
      entityId: student._id,
      action: "remove_bookmark",
      oldData,
      newData,
      updatedBy: actor?.id || actor?._id,
    });

    return {
      code: STUDENT_CODES.BOOKMARK_REMOVED,
      bookmarks: newData,
    };
  },

  async toggleBookmark(userId, courseId, actor) {
    const student = await Student.findOne({ user: userId });
    if (!student) {
      throw new AppError("Student not found", 404);
    }

    // Lưu dữ liệu cũ để audit logs (mapBookmark dùng cho format chuẩn)
    const oldData = student.bookmarks.map(mapBookmark);

    const index = student.bookmarks.findIndex(
      (b) => b.course.toString() === courseId
    );

    let code;
    let action;

    if (index !== -1) {
      // Nếu đã bookmark, remove bookmark
      student.bookmarks.splice(index, 1);
      code = STUDENT_CODES.BOOKMARK_REMOVED;
      action = "remove_bookmark";
    } else {
      student.bookmarks.push({
        course: new mongoose.Types.ObjectId(courseId),
        addedAt: new Date(),
      });
      code = STUDENT_CODES.BOOKMARK_ADDED;
      action = "add_bookmark";
    }

    await student.save();

    // *** GỌI LẠI getBookmarksUseCase để lấy danh sách bookmark mới đầy đủ thông tin khóa học ***
    const bookmarksResult = await this.getBookmarksUseCase({
      userId,
      query: { cursor: null, limit: 12 },
    });

    const newData = bookmarksResult.data;

    // Lưu audit logs đầy đủ với dữ liệu mới đã populate
    await saveAuditLogs({
      entityType: "student_bookmarks",
      entityId: student._id,
      action,
      oldData,
      newData,
      updatedBy: actor?.id || actor?._id,
    });

    // Trả về bookmarks đầy đủ để client cập nhật chính xác
    return {
      code,
      bookmarks: newData,
    };
  },
};

export default StudentBookmarkService;
