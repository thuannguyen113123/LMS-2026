import mongoose from "mongoose";
import Comment from "../../models/comment/comment.model.js";
import CommentService from "../../services/comment/comment.service.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";

import AppError from "../../utils/AppError.js";
import { COMMENT_CODES } from "../../constants/comment.codes.js";

const { ObjectId } = mongoose.Types;

const getUserIdentifier = (user) =>
  user?.email || user?.phone || user?._id || "unknown";

const mapDoc = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
};

export const commentController = {
  async create(req, res) {
    try {
      const comment = await CommentService.createComment(
        {
          ...req.validatedBody,
          authorId: req.user?.id || req.user?._id,
        },
        req.user
      );

      return res.status(201).json({
        success: true,
        code: COMMENT_CODES.COMMENT_CREATED,
        message: "Tạo bình luận thành công",
        data: {
          comment,
        },
      });
    } catch (err) {
      console.error("Create comment error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: COMMENT_CODES.COMMENT_CREATE_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async list(req, res) {
    const userId = req.user?.id;
    const result = await CommentService.listCommentsUseCase({
      query: req.query,
      targetType: req.params.targetType,
      targetId: req.params.targetId,
      userId,
    });

    return res.json({
      success: true,
      comments: result.data,
      pagination: result.pagination,
    });
  },

  async listAll(req, res) {
    try {
      const result = await CommentService.listCommentsForAdmin(req.query);

      return res.json({
        success: true,
        code: COMMENT_CODES.COMMENT_LIST_SUCCESS,
        message: "Lấy danh sách bình luận thành công",
        comments: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("Admin list comments error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: COMMENT_CODES.COMMENT_LIST_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async listReplies(req, res) {
    try {
      const { parentId } = req.params;
      const { limit = 10, startAfterId = null } = req.query;

      const result = await CommentService.getReplies(parentId, {
        limit: parseInt(limit),
        startAfterId,
      });

      return res.json({
        success: true,
        code: COMMENT_CODES.COMMENT_LIST_SUCCESS,
        message: "Lấy danh sách replies thành công",
        data: result,
      });
    } catch (err) {
      console.error("List replies error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: COMMENT_CODES.COMMENT_LIST_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;

      const comment = await CommentService.getCommentById(id);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bình luận",
        });
      }

      return res.json({
        success: true,
        comment: mapDoc(comment),
      });
    } catch (err) {
      console.error("Get comment by id error:", err);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
  async listTestimonials(req, res) {
    try {
      const { limit = 6, page = 1, type = "hot" } = req.query;

      const result = await CommentService.listTestimonialsUseCase({
        limit: Number(limit),
        page: Number(page),
        type,
      });

      return res.status(200).json({
        success: true,
        code: COMMENT_CODES.LIST_TESTIMONIALS_SUCCESS,
        message: "Lấy testimonials thành công",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("ListTestimonials controller error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: COMMENT_CODES.LIST_TESTIMONIALS_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.user?._id;

      const { error, value } = commentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const oldData = await Comment.findOne({
        _id: id,
        authorId: userId,
      }).lean();

      if (!oldData) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền sửa bình luận này",
        });
      }

      await CommentService.updateComment(id, value);
      const updatedData = await CommentService.getCommentById(id);

      await saveAuditLogs({
        entityType: "comments",
        entityId: id,
        action: "update",
        oldData,
        newData: updatedData,
        updatedBy: getUserIdentifier(req.user),
      });

      return res.json({
        success: true,
        message: "Cập nhật bình luận thành công",
        comment: mapDoc(updatedData),
      });
    } catch (err) {
      console.error("Update comment error:", err);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;

      const result = await CommentService.deleteComment(id, req.user);

      return res.json({
        success: true,
        code: COMMENT_CODES.COMMENT_DELETE_SUCCESS,
        message: "Xoá bình luận thành công",
        data: result,
      });
    } catch (err) {
      console.error("Delete comment controller error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: COMMENT_CODES.COMMENT_DELETE_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async removeMany(req, res) {
    try {
      const result = await CommentService.deleteManyComments(
        req.body.ids,
        req.user
      );

      return res.json({
        success: true,
        code: COMMENT_CODES.COMMENT_DELETE_MANY_SUCCESS,
        message: "Xoá nhiều bình luận thành công",
        data: {
          deletedIds: result.deletedIds,
        },
      });
    } catch (err) {
      console.error("Remove many comments error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: COMMENT_CODES.COMMENT_DELETE_MANY_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async like(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || req.user?._id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          code: COMMENT_CODES.COMMENT_NOT_FOUND,
          message: "ID bình luận không hợp lệ",
        });
      }

      const result = await CommentService.likeComment(id, userId);

      return res.json({
        success: true,
        code: COMMENT_CODES.COMMENT_UPDATE_SUCCESS,
        message: "Cập nhật like thành công",
        data: result,
      });
    } catch (err) {
      console.error("Like comment error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: COMMENT_CODES.COMMENT_UPDATE_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async report(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const userId = req.user?.id || req.user?._id;

      const result = await CommentService.reportComment(id, userId, reason);

      return res.json({
        success: true,
        code: COMMENT_CODES.COMMENT_REPORT_SUCCESS,
        message: "Báo cáo bình luận thành công",
        data: result,
      });
    } catch (err) {
      console.error("Report comment controller error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: COMMENT_CODES.COMMENT_REPORT_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async restore(req, res) {
    try {
      const { id } = req.params;

      const comment = await Comment.findByIdAndUpdate(
        id,
        { report_count: 0, reportedBy: [] },
        { new: true }
      ).lean();

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bình luận",
        });
      }

      return res.json({
        success: true,
        message: "Khôi phục thành công",
        comment: mapDoc(comment),
      });
    } catch (err) {
      console.error("Restore comment error:", err);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  async upload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Không có file upload",
        });
      }

      const fileData = {
        filename: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        url: `/uploads/${req.file.filename}`,
      };

      return res.json({ success: true, file: fileData });
    } catch (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  async getMyComments(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;

      const comments = await Comment.find({ authorId: userId })
        .sort({ createdAt: -1 })
        .lean();

      return res.json({
        success: true,
        comments: comments.map(mapDoc),
      });
    } catch (err) {
      console.error("Get my comments error:", err);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  async stats(req, res) {
    try {
      const { targetType, targetId } = req.query;

      if (!targetType || !targetId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu targetType hoặc targetId",
        });
      }

      const totalComments = await Comment.countDocuments({
        targetType,
        targetId,
        parentId: null,
      });

      const agg = await Comment.aggregate([
        {
          $match: {
            targetType,
            targetId: new mongoose.Types.ObjectId(targetId),
          },
        },
        {
          $group: {
            _id: null,
            totalLikes: { $sum: "$like_count" },
            totalReports: { $sum: "$report_count" },
          },
        },
      ]);

      const { totalLikes = 0, totalReports = 0 } = agg[0] || {};

      return res.json({
        success: true,
        stats: {
          totalComments,
          totalLikes,
          totalReports,
        },
      });
    } catch (err) {
      console.error("Stats error:", err);
      return res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  async previewExportComments(req, res) {
    try {
      const result = await CommentService.previewExportComments({
        payload: req.body,
      });

      return res.json({
        success: true,
        code: COMMENT_CODES.COMMENT_EXPORT_PREVIEW_SUCCESS,
        data: result,
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || COMMENT_CODES.COMMENT_EXPORT_FAILED,
        message: err.message,
      });
    }
  },

  async exportComments(req, res) {
    try {
      const result = await CommentService.exportComments({
        payload: req.body,
        user: req.user,
      });

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.fileName}"`
      );

      res.setHeader("Content-Type", result.contentType);

      return res.send(result.buffer);
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || COMMENT_CODES.COMMENT_EXPORT_FAILED,
        message: err.message,
      });
    }
  },
};
