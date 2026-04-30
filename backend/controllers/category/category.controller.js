import { CATEGORY_CODES } from "../../constants/category.codes.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import CategoryService from "../../services/category/category.services.js";
import AppError from "./../../utils/AppError.js";

const getUserIdentifier = (user) => user?.email || user?.phone || "unknown";

export const categoryController = {
  //Tạo danh mục
  async create(req, res) {
    try {
      const category = await CategoryService.createCategory(
        {
          ...req.validatedBody,
          createdBy: req.user?.id || req.user?._id,
          updatedBy: req.user?.id || req.user?._id,
        },
        req.user
      );

      return res.status(201).json({
        success: true,
        code: CATEGORY_CODES.CATEGORY_CREATED,
        message: "Tạo danh mục thành công",
        data: {
          category,
        },
      });
    } catch (err) {
      console.error("Create category error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: CATEGORY_CODES.SERVER_ERROR,
        message: "Lỗi server",
      });
    }
  },
  //Tạo nhiều danh mục
  async createMany(req, res) {
    try {
      const result = await CategoryService.createManyCategories(
        req.validatedBody,
        req.user
      );

      return res.status(201).json({
        success: true,
        code: CATEGORY_CODES.CATEGORY_BULK_CREATED,
        data: {
          created: result.created,
          skipped: result.skipped,
          errors: result.errors,
        },
        summary: result.summary,
      });
    } catch (err) {
      console.error("Bulk create category error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: CATEGORY_CODES.CATEGORY_BULK_CREATE_FAILED,
        message: "Import danh mục thất bại",
      });
    }
  },

  async list(req, res) {
    try {
      const result = await CategoryService.listAdminCategoriesUseCase({
        query: req.query,
      });

      return res.json({
        success: true,
        code: CATEGORY_CODES.CATEGORY_LIST_SUCCESS,
        message: "Lấy danh sách danh mục thành công",
        categories: result.data,
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
        code: CATEGORY_CODES.CATEGORY_LIST_FAILED,
        message: "Server error",
      });
    }
  },

  async listPublic(req, res) {
    try {
      const result = await CategoryService.listPublicCategoriesUseCase({
        query: req.query,
      });

      return res.json({
        success: true,
        categories: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
  async options(req, res) {
    try {
      const options = await CategoryService.getCategoryOptions();

      return res.json({
        success: true,
        code: CATEGORY_CODES.CATEGORY_LIST_SUCCESS,
        message: "Lấy category options thành công",
        data: options,
      });
    } catch (err) {
      console.error("Category options error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: CATEGORY_CODES.CATEGORY_LIST_FAILED,
        message: "Server error",
      });
    }
  },
  async update(req, res) {
    try {
      const { id } = req.params;

      const category = await CategoryService.updateCategory(
        id,
        req.validatedBody,
        req.user
      );

      return res.json({
        success: true,
        code: CATEGORY_CODES.CATEGORY_UPDATE_SUCCESS,
        message: "Cập nhật danh mục thành công",
        data: {
          category,
        },
      });
    } catch (err) {
      console.error("❌ Update category error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: CATEGORY_CODES.SERVER_ERROR,
        message: "Lỗi server",
      });
    }
  },

  async removeMany(req, res) {
    try {
      const { ids } = req.body;

      const result = await CategoryService.deleteManyCategories(ids, req.user);

      return res.json({
        success: true,
        code: CATEGORY_CODES.CATEGORY_DELETE_SUCCESS,
        message: "Xóa danh mục thành công",
        data: result,
      });
    } catch (err) {
      console.error("Remove many categories error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: CATEGORY_CODES.SERVER_ERROR,
        message: "Lỗi server",
      });
    }
  },

  async previewExportCategories(req, res) {
    try {
      const result = await CategoryService.previewExportCategories({
        payload: req.body,
      });

      return res.json({
        success: true,
        code: CATEGORY_CODES.CATEGORY_EXPORT_PREVIEW_SUCCESS,
        data: result,
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || CATEGORY_CODES.SERVER_ERROR,
        message: err.message || "Lỗi server khi preview export category",
      });
    }
  },

  async exportCategories(req, res) {
    try {
      const result = await CategoryService.exportCategories({
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
      console.error("Export categories error:", err);

      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || CATEGORY_CODES.SERVER_ERROR,
        message: err.message || "Lỗi server khi export category",
      });
    }
  },
};
