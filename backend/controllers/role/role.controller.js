import { ROLE_CODES } from "../../constants/role.codes.js";
import RoleService from "../../services/role/role.services.js";
import AppError from "../../utils/AppError.js";

export const roleController = {
  async create(req, res) {
    try {
      const { id: userId } = req.user;

      const role = await RoleService.createRole({
        payload: req.validatedBody,
        createdBy: userId,
      });

      return res.status(201).json({
        success: true,
        code: ROLE_CODES.ROLE_CREATED,
        message: "Tạo role thành công",
        data: role,
      });
    } catch (err) {
      console.error("Create role error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: ROLE_CODES.SERVER_ERROR,
        message: "Lỗi server",
      });
    }
  },
  async createMany(req, res) {
    try {
      const user = req.user.id;
      const result = await RoleService.bulkCreateRoles(req.body, user);

      return res.status(201).json({
        success: true,
        code: ROLE_CODES.ROLE_BULK_CREATED,
        data: {
          created: result.created,
          skipped: result.skipped,
          errors: result.errors,
        },
        summary: result.summary,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(400).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: ROLE_CODES.ROLE_BULK_CREATE_FAILED,
        message: "Lỗi server khi import roles",
      });
    }
  },
  async list(req, res) {
    try {
      const result = await RoleService.listAdminRolesUseCase({
        query: req.query,
        role: req.user.active_role,
        userId: req.user.id,
      });

      return res.json({
        success: true,
        code: ROLE_CODES.ROLE_LIST_SUCCESS,
        message: "Lấy danh sách role thành công",
        roles: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error(err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: ROLE_CODES.ROLE_LIST_FAILED,
        message: "Không thể lấy danh sách role",
      });
    }
  },
  async update(req, res) {
    try {
      const { id } = req.params;
      const user = req.user.id;
      const payload = req.body;

      const updatedRole = await RoleService.updateRole({ id, payload, user });

      return res.json({
        success: true,
        code: ROLE_CODES.ROLE_UPDATE_SUCCESS,
        message: "Cập nhật role thành công",
        data: updatedRole,
      });
    } catch (err) {
      console.error("Update role error:", err);
      if (err instanceof AppError) {
        return res.status(400).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }
      return res.status(500).json({
        success: false,
        code: ROLE_CODES.ROLE_UPDATE_FAILED,
        message: "Không thể cập nhật role",
      });
    }
  },
  //Xem dữ liệu trước khi xuất
  async previewExportRoles(req, res) {
    try {
      const result = await RoleService.previewExportRoles({
        payload: req.body,
      });

      return res.json({
        success: true,
        code: ROLE_CODES.ROLE_EXPORT_PREVIEW_SUCCESS,
        data: result,
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || ROLE_CODES.SERVER_ERROR,
        message: err.message || "Lỗi server khi preview export",
      });
    }
  },
  //Xuất dữ liệu
  async exportRoles(req, res) {
    try {
      const result = await RoleService.exportRoles({
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
      console.error("Export roles error:", err);

      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || ROLE_CODES.SERVER_ERROR,
        message: err.message || "Lỗi server khi export role",
      });
    }
  },
  //Xóa dữ liệu
  async removeMany(req, res) {
    try {
      const { ids } = req.body;
      const userId = req.user.id;
      const result = await RoleService.deleteManyRoles(ids, userId);

      return res.json({
        success: true,
        code: ROLE_CODES.ROLE_DELETE_MANY_SUCCESS,
        data: result,
      });
    } catch (err) {
      console.error("Remove many roles error:", err);

      if (err instanceof AppError) {
        return res.status(400).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }
      return res.status(500).json({
        success: false,
        code: ROLE_CODES.ROLE_DELETE_MANY_FAILED,
        message: "Lỗi server khi xóa nhiều role",
      });
    }
  },
};
