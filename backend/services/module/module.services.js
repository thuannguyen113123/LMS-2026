import { MODULE_CODES } from "../../constants/module.codes.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import Module from "../../models/modules/modules.model.js";
import AppError from "../../utils/AppError.js";
import { exportModulesFile } from "./module.export.js";

export const mapModule = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  return {
    id: doc._id.toString(),

    name: doc.name,
    code: doc.code,
    slug: doc.slug,

    description: doc.description,

    icon: doc.icon,
    path: doc.path,
    order: doc.order,

    isActive: doc.isActive,
    isSystemModule: doc.isSystemModule,

    visibility: doc.visibility,

    group: doc.group, // ✅ thêm dòng này

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};
export const validateModuleExportScope = ({ scope, selectedIds }) => {
  if (!["ALL", "SELECTED", "CURRENT_PAGE"].includes(scope)) {
    throw new AppError(
      MODULE_CODES.MODULE_EXPORT_SCOPE_INVALID,
      "Phạm vi export không hợp lệ",
      400
    );
  }

  if (scope === "SELECTED" && (!selectedIds || selectedIds.length === 0)) {
    throw new AppError(
      MODULE_CODES.MODULE_EXPORT_SELECTED_EMPTY,
      "Chưa chọn module để export",
      400
    );
  }
};

export const validateModuleExportFormat = (format) => {
  if (!["excel", "pdf"].includes(format)) {
    throw new AppError(
      MODULE_CODES.MODULE_EXPORT_FORMAT_INVALID,
      "Định dạng export không hợp lệ",
      400
    );
  }
};

const ModuleServices = {
  async createModule(data, user) {
    try {
      const name = data.name?.trim();
      const code = data.code?.trim()?.toLowerCase();

      if (!name || !code) {
        throw new AppError(
          MODULE_CODES.MODULE_CREATE_FAILED,
          "Tên hoặc code module không hợp lệ",
          400
        );
      }

      // ✅ duplicate code check
      const existed = await Module.findOne({ code });
      if (existed) {
        throw new AppError(
          MODULE_CODES.MODULE_EXISTS,
          "Module đã tồn tại",
          409
        );
      }

      const created = await Module.create({
        ...data,
        name,
        code,
        createdBy: user?.id,
        updatedBy: user?.id,
      });

      // ✅ audit log trong service
      await saveAuditLogs({
        entityType: "modules",
        entityId: created._id,
        action: "create",
        oldData: {},
        newData: {
          name: created.name,
          code: created.code,
          path: created.path,
          isActive: created.isActive,
          group: created.group,

          visibility: created.visibility,
        },
        updatedBy: user?.id,
      });

      return mapModule(created);
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("CreateModule service error:", err);

      throw new AppError(
        MODULE_CODES.MODULE_CREATE_FAILED,
        "Tạo module thất bại",
        500
      );
    }
  },

  async listModulesUseCase({ query }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    // ===== FILTER =====
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === "true";
    }

    // ===== FILTER =====
    if (query.isSystemModule && query.isSystemModule !== "All") {
      const isSystem = query.isSystemModule === "true";

      if (isSystem) {
        // chỉ module system
        filter.isSystemModule = true;
      } else {
        // custom module = false OR không tồn tại field
        filter.$or = [
          { isSystemModule: false },
          { isSystemModule: { $exists: false } },
          { isSystemModule: null },
        ];
      }
    }
    if (query.visibility && query.visibility !== "All") {
      filter.visibility = query.visibility;
    }
    if (query.search?.trim()) {
      filter.name = {
        $regex: query.search.trim(),
        $options: "i",
      };
    }

    // ===== QUERY =====
    const [modules, total] = await Promise.all([
      Module.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Module.countDocuments(filter),
    ]);

    return {
      data: modules.map(mapModule),

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
  async getSidebarModules(userPermissions = [], role = "student") {
    console.log("ROLE BACKEND:", role);
    // ===== ROLE → VISIBILITY =====
    const visibilityMap = {
      admin: ["admin", "public", "both", "instructor"],
      instructor: ["public", "both", "instructor"],
      student: ["public", "both"],
    };

    // ===== QUERY BASE =====
    const docs = await Module.find({
      isActive: true,
      visibility: {
        $in: visibilityMap[role] || ["public"],
      },
    })
      .select("name path icon order group code requiredPermissions visibility")
      .sort({ order: 1 })
      .lean();

    // ⭐⭐⭐ ADMIN BYPASS (QUAN TRỌNG)
    if (role === "admin") {
      return docs.map(mapModule);
    }

    // ===== NORMALIZE USER PERMISSIONS =====
    const permissionSet = new Set(
      userPermissions.map((p) => (typeof p === "string" ? p : p.code))
    );

    // ===== FILTER ACCESS =====
    const filtered = docs.filter((module) => {
      const required = Array.isArray(module.requiredPermissions)
        ? module.requiredPermissions
        : module.requiredPermissions
        ? [module.requiredPermissions]
        : [];

      // module public
      if (required.length === 0) return true;

      return required.some((perm) => permissionSet.has(perm));
    });

    return filtered.map(mapModule);
  },

  async getModuleById(id) {
    return Module.findById(id).lean();
  },

  async updateModule(id, data, user) {
    try {
      const existed = await Module.findById(id);

      if (!existed) {
        throw new AppError(
          MODULE_CODES.MODULE_NOT_FOUND,
          "Không tìm thấy module",
          404
        );
      }

      const oldMapped = mapModule(existed);

      // ✅ không cho đổi code nếu system module
      if (existed.isSystemModule && data.code) {
        delete data.code;
      }

      // ✅ nếu đổi code → check duplicate
      if (data.code && data.code !== existed.code) {
        const dup = await Module.findOne({ code: data.code });
        if (dup) {
          throw new AppError(
            MODULE_CODES.MODULE_EXISTS,
            "Code module đã tồn tại",
            409
          );
        }
      }

      Object.assign(existed, {
        ...data,
        updatedBy: user?.id,
      });

      await existed.save();

      const mapped = mapModule(existed);

      // ✅ audit log trong service
      await saveAuditLogs({
        entityType: "modules",
        entityId: existed._id,
        action: "update",
        oldData: oldMapped,
        newData: mapped,
        updatedBy: user?.id,
      });

      return mapped;
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("UpdateModule service error:", err);

      throw new AppError(
        MODULE_CODES.MODULE_UPDATE_FAILED,
        "Cập nhật module thất bại",
        500
      );
    }
  },
  async updateManyOrder(list = []) {
    const bulkOps = list.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order } },
      },
    }));

    if (bulkOps.length) {
      await Module.bulkWrite(bulkOps);
    }

    return true;
  },

  async toggleActive(id, isActive, user) {
    try {
      if (typeof isActive !== "boolean") {
        throw new AppError(
          MODULE_CODES.MODULE_TOGGLE_INVALID,
          "Trạng thái không hợp lệ",
          400
        );
      }

      const existed = await Module.findById(id);

      if (!existed) {
        throw new AppError(
          MODULE_CODES.MODULE_NOT_FOUND,
          "Không tìm thấy module",
          404
        );
      }

      const oldMapped = mapModule(existed);

      existed.isActive = isActive;
      existed.updatedBy = user?.id;

      await existed.save();

      const mapped = mapModule(existed);

      // ✅ audit trong service
      await saveAuditLogs({
        entityType: "modules",
        entityId: existed._id,
        action: "toggle_active",
        oldData: oldMapped,
        newData: mapped,
        updatedBy: user?.id,
      });

      return mapped;
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("ToggleModule service error:", err);

      throw new AppError(
        MODULE_CODES.MODULE_TOGGLE_FAILED,
        "Cập nhật trạng thái module thất bại",
        500
      );
    }
  },
  async deleteModule(id) {
    await Module.findByIdAndDelete(id);
    return true;
  },
  async deleteManyModules(ids = [], user) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new AppError(
          MODULE_CODES.MODULE_DELETE_EMPTY_IDS,
          "Không có module để xóa",
          400
        );
      }

      const modules = await Module.find({ _id: { $in: ids } });

      if (modules.length !== ids.length) {
        throw new AppError(
          MODULE_CODES.MODULE_NOT_FOUND,
          "Có module không tồn tại",
          404
        );
      }

      // ✅ Không cho xóa system module
      const systemOnes = modules.filter((m) => m.isSystemModule);
      if (systemOnes.length > 0) {
        throw new AppError(
          MODULE_CODES.MODULE_DELETE_SYSTEM_FORBIDDEN,
          "Không được xóa module hệ thống",
          400
        );
      }

      const mappedOld = modules.map(mapModule);

      await Module.deleteMany({ _id: { $in: ids } });

      // ✅ audit log trong service
      await Promise.all(
        modules.map((m, i) =>
          saveAuditLogs({
            entityType: "modules",
            entityId: m._id,
            action: "delete",
            oldData: mappedOld[i],
            newData: {},
            updatedBy: user?.id,
          })
        )
      );

      return {
        deletedIds: ids,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("DeleteManyModule service error:", err);

      throw new AppError(
        MODULE_CODES.MODULE_DELETE_MANY_FAILED,
        "Xóa module thất bại",
        500
      );
    }
  },

  async getModulesForExport({ scope, selectedIds, filters }) {
    const query = {};

    if (filters?.search) {
      query.name = { $regex: filters.search, $options: "i" };
    }

    if (typeof filters?.isActive === "boolean") {
      query.isActive = filters.isActive;
    }

    if (typeof filters?.isSystemModule === "boolean") {
      query.isSystemModule = filters.isSystemModule;
    }

    if (scope === "SELECTED") {
      query._id = { $in: selectedIds };
    }

    return Module.find(query).sort({ order: 1, createdAt: -1 }).lean();
  },
  async previewExportModules({ payload }) {
    const { scope, selectedIds = [], filters = {} } = payload;

    validateModuleExportScope({ scope, selectedIds });

    const modules = await this.getModulesForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!modules.length) {
      throw new AppError(
        MODULE_CODES.MODULE_EXPORT_EMPTY,
        "Không có dữ liệu để xem trước",
        404
      );
    }

    const mapped = modules.map(mapModule);

    return {
      total: mapped.length,
      columns: [
        "name",
        "code",
        "slug",
        "path",
        "order",
        "isActive",
        "isSystemModule",

        "visibility",
        "group",
        "createdAt",
      ],
      preview: mapped.slice(0, 10),
    };
  },
  async exportModules({ payload, user }) {
    const { scope, selectedIds, filters, format } = payload;

    validateModuleExportScope({ scope, selectedIds });
    validateModuleExportFormat(format);

    const modules = await this.getModulesForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!modules.length) {
      throw new AppError(
        MODULE_CODES.MODULE_EXPORT_EMPTY,
        "Không có dữ liệu để export",
        404
      );
    }

    const buffer = await exportModulesFile({
      modules,
      format,
    });

    return {
      buffer,
      fileName: `modules_${Date.now()}.${format === "excel" ? "xlsx" : "pdf"}`,
      contentType:
        format === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
    };
  },
};

export default ModuleServices;
