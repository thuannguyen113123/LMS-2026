import { PERMISSION_CODES } from "../../constants/permission.codes.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import Permission from "../../models/permission/permission.model.js";
import Module from "../../models/modules/modules.model.js";
import { permissionBulkSchema } from "../../validators/permisson/permission.validator.js";
import AppError from "../../utils/AppError.js";
import { exportPermissions } from "./permission.export.js";
import mongoose from "mongoose";

export const mapPermission = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  return {
    id: doc._id?.toString(),

    name: doc.name,
    code: doc.code,
    description: doc.description,

    category: doc.category,
    isSystemPermission: doc.isSystemPermission,

    moduleId: doc.moduleId?._id
      ? doc.moduleId._id.toString()
      : doc.moduleId?.toString(),
    module: doc.moduleId?.name || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};
export const validateExportScope = ({ scope, selectedIds }) => {
  if (!["ALL", "SELECTED", "CURRENT_PAGE"].includes(scope)) {
    throw new AppError(
      PERMISSION_CODES.PERMISSION_EXPORT_SCOPE_INVALID,
      "Phạm vi export không hợp lệ",
      400
    );
  }

  if (scope === "SELECTED" && (!selectedIds || selectedIds.length === 0)) {
    throw new AppError(
      PERMISSION_CODES.PERMISSION_EXPORT_SELECTED_EMPTY,
      "Chưa chọn permission để export",
      400
    );
  }
};

export const validateExportFormat = (format) => {
  if (!["excel", "pdf"].includes(format)) {
    throw new AppError(
      PERMISSION_CODES.PERMISSION_EXPORT_FORMAT_INVALID,
      "Định dạng export không hợp lệ",
      400
    );
  }
};

const PermissionService = {
  async createPermission({ payload, createdBy }) {
    const { name, code, moduleId, description, category, isSystemPermission } =
      payload;

    const normalizedName = name?.trim();
    const normalizedCode = code?.trim();

    if (!normalizedName || !normalizedCode) {
      throw new AppError(
        PERMISSION_CODES.PERMISSION_INVALID_PAYLOAD,
        "Thiếu thông tin permission",
        400
      );
    }

    const existed = await Permission.findOne({ code: normalizedCode }).lean();

    if (existed) {
      throw new AppError(
        PERMISSION_CODES.PERMISSION_CODE_EXISTED,
        "Permission code đã tồn tại",
        409
      );
    }

    const created = await Permission.create({
      name: normalizedName,
      code: normalizedCode,
      moduleId,
      description: description || "",
      category: category || "read",
      isSystemPermission: isSystemPermission ?? false,
      createdBy,
      updatedBy: createdBy,
    });

    const permission = mapPermission(created);

    await saveAuditLogs({
      entityType: "permissions",
      entityId: created._id,
      action: "create",
      oldData: {},
      newData: permission,
      updatedBy: createdBy,
    });

    return permission;
  },

  async bulkCreatePermissions(inputList = [], updatedBy) {
    if (!Array.isArray(inputList) || inputList.length === 0) {
      throw new AppError(
        PERMISSION_CODES.PERMISSION_BULK_INVALID_PAYLOAD,
        "Danh sách permission không hợp lệ"
      );
    }

    const validItems = [];
    const errors = [];

    // 1️⃣ Validate từng dòng
    inputList.forEach((item, index) => {
      const { error, value } = permissionBulkSchema.validate(item, {
        abortEarly: false,
      });

      if (error) {
        errors.push({
          index,
          code: PERMISSION_CODES.PERMISSION_BULK_VALIDATION_FAILED,
          name: item?.name || null,
          reason: error.details.map((d) => d.message),
        });
      } else {
        validItems.push(value);
      }
    });

    // 2️⃣ Chặn trùng code trong file
    const seen = new Set();
    const uniqueValidItems = [];

    validItems.forEach((item) => {
      if (seen.has(item.code)) {
        errors.push({
          code: PERMISSION_CODES.PERMISSION_DUPLICATE_IN_FILE,
          name: item.code,
          reason: ["Permission bị trùng trong file import"],
        });
      } else {
        seen.add(item.code);
        uniqueValidItems.push(item);
      }
    });

    // 3️⃣ Map moduleName → moduleId
    const moduleNames = [
      ...new Set(
        uniqueValidItems.map((i) => i.moduleName.trim().toLowerCase())
      ),
    ];

    const modules = await Module.find({
      name: { $in: moduleNames },
    })
      .collation({ locale: "vi", strength: 2 })
      .select("_id name")
      .lean();

    const moduleMap = new Map(
      modules.map((m) => [m.name.toLowerCase(), m._id])
    );

    const mappedItems = [];

    uniqueValidItems.forEach((item, index) => {
      const moduleId = moduleMap.get(item.moduleName.toLowerCase());

      if (!moduleId) {
        errors.push({
          index,
          code: PERMISSION_CODES.PERMISSION_MODULE_NOT_FOUND,
          name: item.name,
          reason: [`Module "${item.moduleName}" không tồn tại`],
        });
        return;
      }

      mappedItems.push({
        name: item.name,
        code: item.code,
        description: item.description,
        category: item.category,
        isSystemPermission: item.isSystemPermission,
        moduleId,
        createdBy: updatedBy,
        updatedBy,
      });
    });

    // 4️⃣ Check trùng DB
    const codes = mappedItems.map((i) => i.code);
    const existing = await Permission.find({ code: { $in: codes } }).lean();
    const existingSet = new Set(existing.map((p) => p.code));

    const toCreate = [];
    const skipped = [];

    mappedItems.forEach((item) => {
      if (existingSet.has(item.code)) {
        skipped.push({
          code: PERMISSION_CODES.PERMISSION_ALREADY_EXISTS,
          name: item.code,
        });
      } else {
        toCreate.push(item);
      }
    });

    // 🔥 5️⃣ FIX QUAN TRỌNG: KHÔNG insertMany rỗng
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

    // 6️⃣ Insert
    const createdDocs = await Permission.insertMany(toCreate, {
      ordered: false,
    });

    // 7️⃣ Audit log
    await Promise.all(
      createdDocs.map((p) =>
        saveAuditLogs({
          entityType: "permissions",
          entityId: p._id,
          oldData: {},
          newData: p.toJSON(),
          updatedBy,
        })
      )
    );

    return {
      created: createdDocs.map((p) => p.toJSON()),
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
  async listAdminPermissionsUseCase({ query }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    /** CATEGORY **/
    if (query.category && query.category !== "All") {
      filter.category = query.category;
    }

    /** SEARCH **/
    if (query.search?.trim()) {
      filter.name = {
        $regex: query.search.trim(),
        $options: "i",
      };
    }

    /** SORT (giống course default) **/
    const sort = { _id: 1 };

    const [docs, total] = await Promise.all([
      Permission.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("moduleId", "name code slug")
        .lean(),

      Permission.countDocuments(filter),
    ]);

    return {
      data: docs.map(mapPermission),

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
  async getPermissionById(id) {
    return await Permission.findById(id);
  },

  async updatePermission({ id, payload, user }) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(
        PERMISSION_CODES.PERMISSION_ID_INVALID,
        "ID permission không hợp lệ"
      );
    }

    const oldPermission = await Permission.findById(id).lean();

    if (!oldPermission) {
      throw new AppError(
        PERMISSION_CODES.PERMISSION_NOT_FOUND,
        "Không tìm thấy quyền"
      );
    }

    const updatedPermission = await Permission.findByIdAndUpdate(
      id,
      {
        name: payload.name,
        code: payload.code,
        description: payload.description,
        category: payload.category,
        moduleId: payload.moduleId,
        isSystemPermission: payload.isSystemPermission,
        updatedBy: user, // giống roles
      },
      { new: true }
    ).lean();

    await saveAuditLogs({
      entityType: "permissions",
      entityId: id,
      action: "update",
      oldData: oldPermission,
      newData: updatedPermission,
      updatedBy: user,
    });

    return mapPermission(updatedPermission);
  },

  async deleteManyPermissions({ ids, deletedBy }) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError(
        PERMISSION_CODES.PERMISSION_INVALID_PAYLOAD,
        "Danh sách quyền không hợp lệ"
      );
    }

    const oldDocs = await Permission.find({ _id: { $in: ids } }).lean();

    if (oldDocs.length !== ids.length) {
      throw new AppError(
        PERMISSION_CODES.PERMISSION_NOT_FOUND,
        "Một hoặc nhiều quyền không tồn tại"
      );
    }

    await Permission.deleteMany({ _id: { $in: ids } });

    return {
      deletedIds: ids,
      oldDocs,
    };
  },
  /* ---------- Export ---------- */
  async getPermissionsForExport({ scope, selectedIds, filters }) {
    const query = {};

    if (filters?.search) {
      query.name = { $regex: filters.search, $options: "i" };
    }

    if (filters?.moduleId) {
      query.moduleId = filters.moduleId;
    }

    if (typeof filters?.isSystemPermission === "boolean") {
      query.isSystemPermission = filters.isSystemPermission;
    }

    if (filters?.category) {
      query.category = filters.category;
    }

    if (scope === "SELECTED") {
      query._id = { $in: selectedIds };
    }

    const permissions = await Permission.find(query)
      .populate("moduleId", "name code")
      .sort({ createdAt: -1 })
      .lean();

    return permissions.map(mapPermission); // ✅ chuẩn giống roles
  },

  async previewExportPermissions({ payload }) {
    const { scope, selectedIds = [], filters = {} } = payload;

    validateExportScope({ scope, selectedIds });

    const permissions = await this.getPermissionsForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!permissions.length) {
      throw new AppError(
        PERMISSION_CODES.PERMISSION_EXPORT_EMPTY,
        "Không có dữ liệu để xem trước",
        404
      );
    }

    return {
      total: permissions.length,
      columns: [
        "name",
        "code",
        "category",
        "description",
        "module",
        "isSystemPermission",
        "createdAt",
      ],
      preview: permissions.slice(0, 10),
    };
  },

  async exportPermissions({ payload, user }) {
    const { scope, selectedIds, filters, format } = payload;

    validateExportScope({ scope, selectedIds });
    validateExportFormat(format);

    const permissions = await this.getPermissionsForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!permissions.length) {
      throw new AppError(
        PERMISSION_CODES.PERMISSION_EXPORT_EMPTY,
        "Không có dữ liệu để export",
        404
      );
    }

    const buffer = await exportPermissions({
      permissions,
      format,
      user,
    });

    return {
      buffer,
      fileName: `permissions_${Date.now()}.${
        format === "excel" ? "xlsx" : "pdf"
      }`,
      contentType:
        format === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
    };
  },
};

export default PermissionService;
