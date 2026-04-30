import Comment from "../../models/comment/comment.model.js";
import mongoose from "mongoose";
import AppError from "../../utils/AppError.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import { COMMENT_CODES } from "../../constants/comment.codes.js";
import { exportCommentsFile } from "../../services/comment/comment.export.js";
import NotificationService, {
  TYPE_SETTING_MAP,
} from "../../services/notification/notification.service.js";
import Lesson from "../../models/lesson/lesson.model.js";
import Course from "../../models/courses/Course.js";
import User from "../../models/user/user.model.js";

const ObjectId = mongoose.Types.ObjectId;

export const mapComment = (doc, extra = {}) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  return {
    id: doc._id?.toString(),

    targetType: doc.targetType,
    targetId: doc.targetId?.toString(),

    parentId: doc.parentId?.toString() || null,

    content: doc.content,

    like_count: doc.like_count || 0,
    likedBy: doc.likedBy || [],
    reportCount: doc.report_count || 0,

    author: {
      id: doc.authorId?._id?.toString(),
      fullname: doc.authorId?.fullname || "Anonymous",
      avatar:
        doc.authorId?.avatar || "https://i.pravatar.cc/150?u=default-avatar",

      role: doc.authorId?.active_role_id?.name || "Member",

      company: doc.metadata?.company || "Trusted Partner",
    },

    attachments: doc.attachments || [],
    reactions: doc.reactions || [],
    metadata: doc.metadata || {},

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,

    replyCount: doc.replyCount || 0,

    ...extra,
  };
};

export const validateCommentExportScope = ({ scope, selectedIds }) => {
  if (!["ALL", "SELECTED", "CURRENT_PAGE"].includes(scope)) {
    throw new AppError(
      COMMENT_CODES.COMMENT_EXPORT_SCOPE_INVALID,
      "Phạm vi export không hợp lệ",
      400
    );
  }

  if (scope === "SELECTED" && (!selectedIds || selectedIds.length === 0)) {
    throw new AppError(
      COMMENT_CODES.COMMENT_EXPORT_SELECTED_EMPTY,
      "Chưa chọn bình luận để export",
      400
    );
  }
};

export const validateCommentExportFormat = (format) => {
  if (!["excel", "pdf"].includes(format)) {
    throw new AppError(
      COMMENT_CODES.COMMENT_EXPORT_FORMAT_INVALID,
      "Định dạng export không hợp lệ",
      400
    );
  }
};

export function buildCommentFilter({ query, targetType, targetId }) {
  const filter = {};

  if (!targetType) {
    throw new Error("Missing targetType");
  }

  filter.targetType = targetType;

  if (targetType !== "home") {
    if (!targetId || !ObjectId.isValid(targetId)) {
      throw new Error("Invalid targetId");
    }

    filter.targetId = new ObjectId(targetId);
  }

  if (!query.parentId || query.parentId === "root") {
    filter.parentId = null;
  }

  if (query.authorId && ObjectId.isValid(query.authorId)) {
    filter.authorId = new ObjectId(query.authorId);
  }

  if (query.search?.trim()) {
    filter.content = {
      $regex: query.search.trim(),
      $options: "i",
    };
  }

  return filter;
}
export function applyCommentFilter(filter, filterType) {
  switch (filterType) {
    case "recent":
      filter.createdAt = {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      };
      break;

    case "hotOnly":
      filter.like_count = { $gte: 5 };
      break;

    case "reported":
      filter.report_count = { $gte: 1 };
      break;
  }

  return filter;
}
export function buildCommentSort({ sort }) {
  switch (sort) {
    case "hot":
      return { like_count: -1, _id: -1 };

    case "oldest":
      return { createdAt: 1, _id: 1 };

    case "new":
    default:
      return { createdAt: -1, _id: -1 };
  }
}
export function applyCursorPagination(filter, startAfterId, sortOptions) {
  if (!startAfterId) return filter;

  const cursorId = new ObjectId(startAfterId);

  const isAsc = Object.values(sortOptions)[0] === 1;

  filter._id = isAsc ? { $gt: cursorId } : { $lt: cursorId };

  return filter;
}

const awaitCommentService = {
  async createComment(data, user) {
    try {
      const content = data.content?.trim();

      if (!content) {
        throw new AppError(
          COMMENT_CODES.COMMENT_INVALID_CONTENT,
          "Nội dung bình luận không hợp lệ",
          400
        );
      }

      if (!data.targetType || !data.targetId) {
        throw new AppError(
          COMMENT_CODES.COMMENT_INVALID_TARGET,
          "Thiếu targetType hoặc targetId",
          400
        );
      }

      // Tạo comment
      const created = await Comment.create({
        targetType: data.targetType,
        targetId: new ObjectId(data.targetId),
        parentId: data.parentId ? new ObjectId(data.parentId) : null,
        authorId: new ObjectId(data.authorId),
        content,
        attachments: data.attachments || [],
        metadata: data.metadata || {},
        createdBy: user?.id || user?._id,
        updatedBy: user?.id || user?._id,
      });

      // Audit log
      await saveAuditLogs({
        entityType: "comments",
        entityId: created._id,
        action: "create",
        oldData: {},
        newData: {
          content: created.content,
          targetType: created.targetType,
          targetId: created.targetId,
        },
        updatedBy: user?.id || user?._id,
      });

      // Populate author để trả về mapComment
      const populated = await Comment.findById(created._id).populate({
        path: "authorId",
        select: "fullname avatar active_role_id",
        populate: {
          path: "active_role_id",
          select: "name",
        },
      });

      const mappedComment = mapComment(populated);

      // Gửi notification đến giảng viên nếu comment trên course/lesson
      let instructorUserId = null;

      if (data.targetType === "course") {
        const course = await Course.findById(data.targetId).populate(
          "instructor"
        );

        if (course?.instructor?.user) {
          instructorUserId = course.instructor.user;
        }
      } else if (data.targetType === "lesson") {
        const lesson = await Lesson.findById(data.targetId).populate({
          path: "course",
          populate: { path: "instructor" },
        });
        if (lesson?.course?.instructor?.user) {
          instructorUserId = lesson.course.instructor.user;
        }
      }

      if (instructorUserId) {
        await NotificationService.send({
          userId: instructorUserId,
          type: TYPE_SETTING_MAP.COURSE_COMMENT,
          title: "Có bình luận mới",
          message: `${user?.name || "Một học viên"} đã bình luận trên ${
            data.targetType
          } của bạn`,

          entityId: data.targetId,
          entityType: data.targetType,

          meta: {
            commentId: created._id,
            authorId: user?.id,
          },
        });
      }

      return mappedComment;
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("CreateComment service error:", err);

      throw new AppError(
        COMMENT_CODES.COMMENT_CREATE_FAILED,
        "Tạo bình luận thất bại",
        500
      );
    }
  },
  async queryComments({ filter, sortOptions, limit = 10 }) {
    const docs = await Comment.aggregate([
      { $match: filter },
      { $sort: sortOptions },
      { $limit: limit + 1 },

      {
        $lookup: {
          from: "roles",
          localField: "authorId.active_role_id",
          foreignField: "_id",
          as: "authorRole",
        },
      },
      {
        $addFields: {
          "authorId.active_role_id": { $arrayElemAt: ["$authorRole", 0] },
        },
      },

      {
        $unwind: {
          path: "$authorId",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "parentId",
          as: "replies",
        },
      },

      {
        $addFields: {
          replyCount: { $size: "$replies" },
        },
      },
    ]);

    const hasNext = docs.length > limit;

    const data = docs.slice(0, limit).map(mapComment);

    return {
      data,
      pagination: {
        limit,
        hasNext,
        nextPageToken: hasNext ? data.at(-1).id : null,
      },
    };
  },
  async listCommentsUseCase(input) {
    const { query, targetType, targetId, userId } = input;

    const limit = Number(query.limit) || 10;

    let filter = buildCommentFilter(input);
    filter = applyCommentFilter(filter, query.filter);

    const sortOptions = buildCommentSort({
      sort: query.sort,
    });

    filter = applyCursorPagination(filter, query.startAfterId, sortOptions);

    const result = await this.queryComments({
      filter,
      sortOptions,
      limit,
    });

    const comments = Array.isArray(result.data) ? result.data : [];

    // chỉ inject field mới
    const mappedComments = comments.map((comment) => ({
      ...comment,
      isLiked:
        comment.likedBy?.some((uid) => uid.toString() === userId) || false,
    }));

    return {
      data: mappedComments,
      pagination: result.pagination,
    };
  },

  //Lấy tất cả bình luận sài cho admin
  async listCommentsForAdmin(query) {
    try {
      const page = Math.max(Number(query.page) || 1, 1);
      const limit = Math.min(Number(query.limit) || 20, 100);
      const skip = (page - 1) * limit;

      const filter = {};

      /** AUTHOR **/
      if (query.authorId && ObjectId.isValid(query.authorId)) {
        filter.authorId = new ObjectId(query.authorId);
      }

      /** SEARCH **/
      if (query.search?.trim()) {
        filter.content = {
          $regex: query.search.trim(),
          $options: "i",
        };
      }

      /** STATUS FILTER (MATCH FRONTEND) **/
      switch (query.status) {
        case "reported":
          filter.report_count = { $gte: 1 };
          break;

        case "hot":
          filter.like_count = { $gte: 5 };
          break;

        case "recent":
          filter.createdAt = {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          };
          break;
      }

      /** SORT **/
      let sortOptions = { createdAt: -1, _id: -1 };

      switch (query.sort) {
        case "oldest":
          sortOptions = { createdAt: 1, _id: 1 };
          break;

        case "hot":
          sortOptions = { like_count: -1, _id: -1 };
          break;
      }

      const [docs, total] = await Promise.all([
        Comment.find(filter)
          .populate("authorId", "fullname email avatar active_role_id")
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),

        Comment.countDocuments(filter),
      ]);

      return {
        data: docs.map(mapComment),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (err) {
      console.error("listCommentsForAdmin error:", err);

      throw new AppError(
        COMMENT_CODES.COMMENT_LIST_FAILED,
        "Không thể lấy danh sách bình luận",
        500
      );
    }
  },
  async listTestimonialsUseCase(query) {
    const limit = Number(query.limit) || 6;

    let filter = {
      parentId: null,
      report_count: { $lt: 1 },

      targetType: {
        $in: ["course", "lesson"],
      },
    };

    filter = applyCommentFilter(filter, query.type);

    const sortOptions = buildCommentSort({
      type: "hot",
    });

    return this.queryComments({
      filter,
      sortOptions,
      limit,
    });
  },

  async getReplies(parentId, { limit = 10, startAfterId = null }) {
    if (!ObjectId.isValid(parentId)) {
      throw new AppError(
        COMMENT_CODES.COMMENT_PARENT_INVALID,
        "parentId không hợp lệ",
        400
      );
    }

    const filter = {
      parentId: new ObjectId(parentId),
    };

    if (startAfterId && ObjectId.isValid(startAfterId)) {
      filter._id = { $gt: new ObjectId(startAfterId) };
    }

    const docs = await Comment.find(filter)
      .sort({ createdAt: 1 })
      .limit(limit + 1)
      .populate({
        path: "authorId",
        select: "fullname avatar active_role_id",
        populate: {
          path: "active_role_id",
          select: "name",
        },
      })
      .lean();

    const hasNext = docs.length > limit;
    const data = docs.slice(0, limit);
    const replyCounts = await Comment.aggregate([
      {
        $match: {
          parentId: { $in: data.map((d) => d._id) },
        },
      },
      {
        $group: {
          _id: "$parentId",
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = {};
    replyCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });
    const replies = data.map((doc) => {
      const mapped = mapComment(doc);

      return {
        ...mapped,

        // inject thêm field ngoài mapper
        replyCount: countMap[doc._id.toString()] || 0,
      };
    });

    const nextPageToken = hasNext ? data[data.length - 1]._id.toString() : null;

    return {
      replies,
      nextPageToken,
      limit,
    };
  },

  async likeComment(commentId, userId) {
    try {
      const comment = await Comment.findById(commentId);

      if (!comment) {
        throw new AppError(
          COMMENT_CODES.COMMENT_NOT_FOUND,
          "Không tìm thấy bình luận",
          404
        );
      }

      const userObjectId = new ObjectId(userId);

      const liked = comment.likedBy.some(
        (uid) => uid.toString() === userObjectId.toString()
      );

      if (liked) {
        comment.likedBy.pull(userObjectId);
      } else {
        comment.likedBy.push(userObjectId);
      }

      comment.like_count = comment.likedBy.length;

      await comment.save();

      /* audit log chuẩn enterprise */
      await saveAuditLogs({
        entityType: "comments",
        entityId: comment._id,
        action: liked ? "unlike" : "like",
        oldData: {},
        newData: {
          like_count: comment.like_count,
        },
        updatedBy: userId,
      });

      /* RETURN MINIMAL DATA (KHÔNG cần mapComment full) */
      return {
        commentId: comment._id.toString(),
        like_count: comment.like_count,
        isLiked: !liked,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("LikeComment service error:", err);

      throw new AppError(
        COMMENT_CODES.COMMENT_UPDATE_FAILED,
        "Cập nhật like thất bại",
        500
      );
    }
  },

  async reportComment(commentId, userId, reason) {
    try {
      // Lấy comment
      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new AppError(
          COMMENT_CODES.COMMENT_NOT_FOUND,
          "Không tìm thấy bình luận",
          404
        );
      }

      // Kiểm tra user đã report chưa
      const alreadyReported = comment.reportedBy.some(
        (id) => id.toString() === userId.toString()
      );
      if (alreadyReported) {
        throw new AppError(
          COMMENT_CODES.COMMENT_ALREADY_REPORTED,
          "Bạn đã báo cáo bình luận này rồi",
          400
        );
      }

      //Cập nhật report
      comment.reportedBy.push(userId);
      comment.report_count = comment.reportedBy.length;
      await comment.save();

      // Audit log
      await saveAuditLogs({
        entityType: "comments",
        entityId: comment._id,
        action: "report",
        oldData: {},
        newData: {
          report_count: comment.report_count,
          reason,
        },
        updatedBy: userId,
      });

      // Lấy tất cả admin
      const adminRole = await Role.findOne({ name: "admin" });

      const admins = await User.find({
        role_ids: adminRole._id,
      }).lean();

      const adminIds = admins
        .filter((u) => u.active_role_id?.name === "admin")
        .map((u) => u._id);

      // Gửi notification tới admin
      await Promise.all(
        adminIds.map((adminId) =>
          NotificationService.send({
            userId: adminId,
            type: TYPE_SETTING_MAP.USER_REPORT,
            title: "Bình luận bị báo cáo",
            message: "Một bình luận vừa bị người dùng báo cáo",

            entityId: comment._id,
            entityType: "Comment",

            meta: {
              reportedBy: userId,
              reason,
            },
          })
        )
      );

      return {
        report_count: comment.report_count,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("ReportComment service error:", err);

      throw new AppError(
        COMMENT_CODES.COMMENT_REPORT_FAILED,
        "Không thể báo cáo bình luận",
        500
      );
    }
  },

  async updateComment(id, data) {
    await Comment.findByIdAndUpdate(id, data);
    return true;
  },

  async deleteComment(commentId, user) {
    try {
      const userId = user?.id || user?._id;

      const comment = await Comment.findById(commentId);

      if (!comment) {
        throw new AppError(
          COMMENT_CODES.COMMENT_NOT_FOUND,
          "Không tìm thấy bình luận",
          404
        );
      }

      // rule: chỉ author hoặc admin mới được xoá
      const isOwner = comment.authorId.toString() === userId.toString();

      const isAdmin = user.active_role_id?.name === "admin";

      if (!isOwner && !isAdmin) {
        throw new AppError(
          COMMENT_CODES.COMMENT_DELETE_FORBIDDEN,
          "Bạn không có quyền xoá bình luận này",
          403
        );
      }

      const oldData = comment.toObject();

      await Comment.deleteOne({ _id: commentId });

      // audit log chuẩn enterprise
      await saveAuditLogs({
        entityType: "comments",
        entityId: commentId,
        action: "delete",
        oldData,
        newData: {},
        updatedBy: userId,
      });

      return {
        id: commentId,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("deleteComment service error:", err);

      throw new AppError(
        COMMENT_CODES.COMMENT_DELETE_FAILED,
        "Không thể xoá bình luận",
        500
      );
    }
  },

  async deleteManyComments(ids = [], user) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError(
          COMMENT_CODES.COMMENT_DELETE_EMPTY_IDS,
          "Danh sách ID không hợp lệ",
          400
        );
      }

      const validIds = ids
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));

      if (validIds.length === 0) {
        throw new AppError(
          COMMENT_CODES.COMMENT_DELETE_EMPTY_IDS,
          "Không có ID hợp lệ",
          400
        );
      }

      // lấy dữ liệu cũ để audit log
      const oldDataList = await Comment.find({
        _id: { $in: validIds },
      }).lean();

      if (!oldDataList.length) {
        throw new AppError(
          COMMENT_CODES.COMMENT_NOT_FOUND,
          "Không tìm thấy bình luận",
          404
        );
      }

      // delete
      await Comment.deleteMany({
        _id: { $in: validIds },
      });

      // audit log trong service
      await Promise.all(
        oldDataList.map((oldData) =>
          saveAuditLogs({
            entityType: "comments",
            entityId: oldData._id,
            action: "delete",
            oldData,
            newData: {},
            updatedBy: user?.id || user?._id,
          })
        )
      );

      return {
        deletedIds: validIds.map((id) => id.toString()),
      };
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("deleteManyComments service error:", err);

      throw new AppError(
        COMMENT_CODES.COMMENT_DELETE_MANY_FAILED,
        "Không thể xoá bình luận",
        500
      );
    }
  },

  async incrementLikeCount(id, increment = 1) {
    await Comment.findByIdAndUpdate(id, {
      $inc: { like_count: increment },
    });
    return true;
  },

  async incrementReportCount(id, increment = 1) {
    await Comment.findByIdAndUpdate(id, {
      $inc: { report_count: increment },
    });
    return true;
  },

  async getCommentsForExport({ scope, selectedIds, filters }) {
    const query = {};

    if (filters?.targetType) {
      query.targetType = filters.targetType;
    }

    if (filters?.search) {
      query.content = {
        $regex: filters.search,
        $options: "i",
      };
    }

    if (scope === "SELECTED") {
      query._id = { $in: selectedIds };
    }

    return Comment.find(query)
      .populate("authorId", "fullname email")
      .sort({ createdAt: -1 })
      .lean();
  },

  async previewExportComments({ payload }) {
    const { scope, selectedIds = [], filters = {} } = payload;

    validateCommentExportScope({ scope, selectedIds });

    const comments = await this.getCommentsForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!comments.length) {
      throw new AppError(
        COMMENT_CODES.COMMENT_EXPORT_EMPTY,
        "Không có dữ liệu để xem trước",
        404
      );
    }

    return {
      total: comments.length,
      columns: Object.keys(comments[0]),
      preview: comments.slice(0, 10),
    };
  },

  async exportComments({ payload, user }) {
    const { scope, selectedIds, filters, format } = payload;

    validateCommentExportScope({ scope, selectedIds });
    validateCommentExportFormat(format);

    const comments = await this.getCommentsForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!comments.length) {
      throw new AppError(
        COMMENT_CODES.COMMENT_EXPORT_EMPTY,
        "Không có dữ liệu để export",
        404
      );
    }

    const buffer = await exportCommentsFile({
      comments,
      format,
    });

    await saveAuditLogs({
      entityType: "comments",
      action: "export",
      entityId: null,
      oldData: {},
      newData: {
        count: comments.length,
        format,
      },
      updatedBy: user?.id || user?._id,
    });

    return {
      buffer,
      fileName: `comments_${Date.now()}.${format === "excel" ? "xlsx" : "pdf"}`,
      contentType:
        format === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
    };
  },
};

export default awaitCommentService;
