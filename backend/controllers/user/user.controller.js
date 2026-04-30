import UserService from "../../services/user/user.services.js";

import { USER_CODES } from "../../constants/user.code.js";
import AppError from "../../utils/AppError.js";
import {
  adminFormUpdateSchema,
  adminInlineUpdateSchema,
} from "../../validators/user/user.validator.js";

const getUserIdentifier = (user) => user?.email || user?.id || "unknown";

export const userController = {
  async listUsers(req, res) {
    try {
      const result = await UserService.listAdminUsersUseCase({
        query: req.query,
      });

      return res.json({
        success: true,
        code: "USER_LIST_SUCCESS",
        message: "Lấy danh sách users thành công",
        users: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: "USER_LIST_FAILED",
        message: "Server error",
      });
    }
  },

  async createUser(req, res) {
    try {
      const result = await UserService.adminCreateUser(
        req.validatedBody,
        req.user
      );

      return res.status(201).json({
        success: true,
        code: USER_CODES.USER_CREATED,
        message: "Tạo user thành công",
        data: result,
      });
    } catch (err) {
      console.error("Create user error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: USER_CODES.USER_CREATE_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async createMany(req, res) {
    try {
      const result = await UserService.bulkCreateUsers(
        req.body,
        getUserIdentifier(req.user)
      );

      return res.status(200).json({
        success: true,
        code: USER_CODES.USER_BULK_CREATED,
        data: {
          created: result.created,
          skipped: result.skipped,
          errors: result.errors,
          summary: result.summary,
        },
      });
    } catch (err) {
      console.error("USER BULK CONTROLLER ERROR:", err);

      return res.status(500).json({
        success: false,
        code: USER_CODES.USER_BULK_CREATE_FAILED,
        message: "Lỗi server khi import users",
      });
    }
  },
  async getProfileBySlug(req, res) {
    try {
      const { slug } = req.params;
      const { type } = req.query;
      const viewerId = req.user?.id || null;

      console.log("viewerId", viewerId);

      const profile = await UserService.getProfileBySlugUseCase(
        slug,
        type,
        viewerId
      );

      return res.json({
        success: true,
        code: USER_CODES.USER_PROFILE_SUCCESS,
        data: profile,
      });
    } catch (err) {
      console.error("Get profile by slug error:", err);

      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || USER_CODES.SERVER_ERROR,
        message: err.message || "Server error",
      });
    }
  },
  async getMyProfile(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;

      const profile = await UserService.getMyProfileUseCase(userId);

      return res.status(200).json({
        success: true,
        code: USER_CODES.USER_PROFILE_SUCCESS,
        message: "Lấy hồ sơ thành công",
        data: profile,
      });
    } catch (err) {
      console.error("Get profile error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: USER_CODES.SERVER_ERROR,
        message: "Lỗi server",
      });
    }
  },
  async updateMyProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await UserService.updateSelfProfile(userId, req.body);

      return res.json({
        success: true,
        code: USER_CODES.USER_PROFILE_UPDATED,
        message: "Cập nhật hồ sơ thành công",
        user,
      });
    } catch (err) {
      console.log(err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: USER_CODES.SERVER_ERROR,
        message: "Server error",
      });
    }
  },
  async adminInlineUpdate(req, res) {
    try {
      const { id } = req.params;

      const { value, error } = adminInlineUpdateSchema.validate(req.body);
      if (error) {
        throw new AppError(
          USER_CODES.USER_ADMIN_INLINE_INVALID_FIELD,
          error.message
        );
      }

      const user = await UserService.updateAdminInline(id, value);

      return res.json({
        success: true,
        code: USER_CODES.USER_ADMIN_INLINE_UPDATED,
        message: "Cập nhật nhanh thành công",
        data: user,
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || USER_CODES.USER_ADMIN_INLINE_UPDATE_FAILED,
        message: err.message || "Inline update thất bại",
      });
    }
  },
  async adminFormUpdate(req, res) {
    try {
      const { id } = req.params;
      const { value } = adminFormUpdateSchema.validate(req.body);

      const user = await UserService.updateAdminFormUser(id, value);

      return res.json({
        success: true,
        code: USER_CODES.USER_ADMIN_FORM_UPDATED,
        message: "Cập nhật thông tin user thành công",
        data: user,
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || USER_CODES.USER_ADMIN_FORM_UPDATE_FAILED,
        message: err.message || "Cập nhật user thất bại",
      });
    }
  },

  async removeMany(req, res, next) {
    try {
      const { ids } = req.body;

      const result = await UserService.removeManyUsers(
        ids,
        getUserIdentifier(req.user)
      );

      return res.json({
        success: true,
        code: USER_CODES.USER_DELETE_MANY_SUCCESS,
        message: `Đã xóa ${result.deletedCount} user`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
  async updatePreferences(req, res) {
    try {
      const userId = req.user.id;

      const preferences = await UserService.updateUserPreferences(
        userId,
        req.body
      );

      return res.json({
        code: USER_CODES.USER_PREFERENCES_UPDATED,
        data: preferences,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        code: USER_CODES.SERVER_ERROR,
        message: "Server error",
      });
    }
  },
  //Xuất báo cáo
  async previewExportUsers(req, res) {
    try {
      const result = await UserService.previewExportUsers({
        payload: req.body,
      });

      return res.json({
        success: true,
        code: USER_CODES.USER_EXPORT_PREVIEW_SUCCESS,
        data: result,
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || USER_CODES.SERVER_ERROR,
        message: err.message || "Lỗi preview export user",
      });
    }
  },

  async exportUsers(req, res) {
    try {
      const result = await UserService.exportUsers({
        payload: req.body,
        user: req.user,
      });

      const { buffer, fileName, contentType } = result;

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.setHeader("Content-Type", contentType);

      return res.send(buffer);
    } catch (err) {
      console.error("Export users error:", err);

      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || USER_CODES.SERVER_ERROR,
        message: err.message || "Lỗi export user",
      });
    }
  },

  async fetchUserProgress(req, res) {
    return res.json({
      success: true,
      progress: {
        completedLessons: 10,
        totalLessons: 20,
        percent: 50,
      },
    });
  },

  async searchUsers(req, res) {
    try {
      const result = await UserService.searchUsersUseCase({
        query: req.query,
      });

      return res.json({
        success: true,
        code: USER_CODES.USER_SEARCH_SUCCESS,
        message: "Tìm kiếm người dùng thành công",
        users: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("Search users error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: USER_CODES.USER_SEARCH_FAILED,
        message: "Lỗi server",
      });
    }
  },
};
