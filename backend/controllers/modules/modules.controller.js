import { MODULE_CODES } from "../../constants/module.codes.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import ModuleService from "../../services/module/module.services.js";
import AppError from "../../utils/AppError.js";

export const moduleController = {
  async list(req, res) {
    try {
      const result = await ModuleService.listModulesUseCase({
        query: req.query,
      });

      return res.json({
        success: true,
        code: MODULE_CODES.MODULE_LIST_SUCCESS,
        message: "Lấy danh sách module thành công",
        modules: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("List module error:", err);

      return res.status(500).json({
        success: false,
        code: MODULE_CODES.MODULE_LIST_FAILED,
        message: "Lấy danh sách module thất bại",
      });
    }
  },
  async getSidebarModules(req, res) {
    try {
      const userPermissions = req.user.permissions || [];

      const role = req.user.active_role || "student";

      const modules = await ModuleService.getSidebarModules(
        userPermissions,
        role
      );

      return res.json({
        success: true,
        code: MODULE_CODES.MODULE_SIDEBAR_SUCCESS,
        data: { modules },
      });
    } catch (err) {
      console.error("Get sidebar module error:", err);

      return res.status(500).json({
        success: false,
        code: MODULE_CODES.MODULE_SIDEBAR_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async create(req, res) {
    try {
      const module = await ModuleService.createModule(
        req.validatedBody,
        req.user
      );

      return res.status(201).json({
        success: true,
        code: MODULE_CODES.MODULE_CREATED,
        message: "Tạo module thành công",
        data: { module },
      });
    } catch (err) {
      console.error("Create module error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: MODULE_CODES.MODULE_CREATE_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async update(req, res) {
    try {
      const module = await ModuleService.updateModule(
        req.params.id,
        req.validatedBody,
        req.user
      );

      return res.json({
        success: true,
        code: MODULE_CODES.MODULE_UPDATE_SUCCESS,
        message: "Cập nhật module thành công",
        data: { module },
      });
    } catch (err) {
      console.error("Update module error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: MODULE_CODES.MODULE_UPDATE_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async sort(req, res) {
    try {
      const { items } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid items" });
      }

      await ModuleService.updateManyOrder(items);

      await saveAuditLogs({
        entityType: "modules",
        action: "sort",
        newData: items,
        updatedBy: req.user,
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("Sort module error:", err);
      return res.status(500).json({ success: false });
    }
  },

  async toggle(req, res) {
    try {
      const module = await ModuleService.toggleActive(
        req.params.id,
        req.validatedBody.isActive,
        req.user
      );

      return res.json({
        success: true,
        code: MODULE_CODES.MODULE_TOGGLE_SUCCESS,
        message: "Cập nhật trạng thái module thành công",
        data: { module },
      });
    } catch (err) {
      console.error("Toggle module error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: MODULE_CODES.MODULE_TOGGLE_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async removeMany(req, res) {
    try {
      const result = await ModuleService.deleteManyModules(
        req.body.ids,
        req.user
      );

      return res.json({
        success: true,
        code: MODULE_CODES.MODULE_DELETE_MANY_SUCCESS,
        message: "Xóa module thành công",
        data: result,
      });
    } catch (err) {
      console.error("Remove many module error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: MODULE_CODES.MODULE_DELETE_MANY_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async previewExportModules(req, res) {
    try {
      const result = await ModuleService.previewExportModules({
        payload: req.body,
      });

      return res.json({
        success: true,
        code: MODULE_CODES.MODULE_EXPORT_PREVIEW_SUCCESS,
        data: result,
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || MODULE_CODES.SERVER_ERROR,
        message: err.message,
      });
    }
  },
  async exportModules(req, res) {
    try {
      const result = await ModuleService.exportModules({
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
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || MODULE_CODES.SERVER_ERROR,
        message: err.message,
      });
    }
  },
};
