import { PERMISSION_CODES } from "../../constants/permission.codes.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import PermissionService from "../../services/permission/permission.services.js";
import AppError from "../../utils/AppError.js";

const getUserIdentifier = (user) => user?.email || user?.phone || "unknown";

export const permissionController = {
  async create(req, res) {
    try {
      const { id: userId } = req.user;

      const permission = await PermissionService.createPermission({
        payload: req.validatedBody,
        createdBy: userId,
      });

      return res.status(201).json({
        success: true,
        code: PERMISSION_CODES.PERMISSION_CREATED,
        message: "Tạo permission thành công",
        data: permission,
      });
    } catch (err) {
      console.error("Create permission error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: PERMISSION_CODES.SERVER_ERROR,
        message: "Lỗi server",
      });
    }
  },

  async createMany(req, res) {
    try {
      const result = await PermissionService.bulkCreatePermissions(
        req.body,
        getUserIdentifier(req.user)
      );

      return res.status(201).json({
        success: true,
        code: PERMISSION_CODES.PERMISSION_BULK_CREATED,
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
        code: PERMISSION_CODES.PERMISSION_BULK_CREATE_FAILED,
        message: "Lỗi server khi import permissions",
      });
    }
  },

  async list(req, res) {
    try {
      const result = await PermissionService.listAdminPermissionsUseCase({
        query: req.query,
      });

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("Get permissions error:", err);

      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },

  async removeMany(req, res) {
    try {
      const { ids } = req.body;

      const { deletedIds, oldDocs } =
        await PermissionService.deleteManyPermissions({
          ids,
          deletedBy: getUserIdentifier(req.user),
        });

      await Promise.all(
        oldDocs.map((doc) =>
          saveAuditLogs({
            entityType: "permissions",
            entityId: doc._id,
            action: "delete",
            oldData: doc,
            newData: {},
            updatedBy: getUserIdentifier(req.user),
          })
        )
      );

      return res.json({
        success: true,
        code: PERMISSION_CODES.PERMISSION_BULK_DELETED,
        data: deletedIds,
      });
    } catch (err) {
      console.error("Delete many permissions error:", err);

      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || "SERVER_ERROR",
        message: err.message || "Lỗi server",
      });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const payload = req.validatedBody;
      const user = req.user.id;

      const updatedPermission = await PermissionService.updatePermission({
        id,
        payload,
        user,
      });

      return res.json({
        success: true,
        code: PERMISSION_CODES.PERMISSION_UPDATED,
        data: updatedPermission,
      });
    } catch (err) {
      console.error("Update permission error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode || 400).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: "INTERNAL_SERVER_ERROR",
        message: "Lỗi server",
      });
    }
  },

  async previewExportPermissions(req, res) {
    try {
      const result = await PermissionService.previewExportPermissions({
        payload: req.body,
      });

      return res.json({
        success: true,
        code: PERMISSION_CODES.PERMISSION_EXPORT_PREVIEW_SUCCESS,
        data: result,
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || PERMISSION_CODES.SERVER_ERROR,
        message: err.message || "Lỗi server khi preview export permission",
      });
    }
  },

  async exportPermissions(req, res) {
    try {
      const result = await PermissionService.exportPermissions({
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
      console.error("Export permissions error:", err);

      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || PERMISSION_CODES.SERVER_ERROR,
        message: err.message || "Lỗi server khi export permission",
      });
    }
  },
};
