import mongoose from "mongoose";
import Role from "../../models/role/role.model.js";
import { roleValidator } from "../../validators/role/role.validator.js";
import { ROLE_CODES } from "../../constants/role.codes.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import AppError from "../../utils/AppError.js";
import { exportRoles } from "./roles.export.js";

export const mapRole = (doc) => {
  if (!doc) return null;

  const role = doc.toObject ? doc.toObject() : doc;

  return {
    id: role._id.toString(),
    name: role.name,
    description: role.description,
    isSystemRole: role.isSystemRole,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
};
const validateExportScope = ({ scope, selectedIds }) => {
  if (!["ALL", "SELECTED", "CURRENT_PAGE"].includes(scope)) {
    throw new AppError(
      ROLE_CODES.ROLE_EXPORT_SCOPE_INVALID,
      "Phạm vi export không hợp lệ",
      400
    );
  }

  if (scope === "SELECTED" && (!selectedIds || selectedIds.length === 0)) {
    throw new AppError(
      ROLE_CODES.ROLE_EXPORT_SELECTED_EMPTY,
      "Chưa chọn role để export",
      400
    );
  }
};

const validateExportFormat = (format) => {
  if (!["excel", "pdf"].includes(format)) {
    throw new AppError(
      ROLE_CODES.ROLE_EXPORT_FORMAT_INVALID,
      "Định dạng export không hợp lệ",
      400
    );
  }
};
export function buildRoleSort(sort) {
  switch (sort) {
    case "name_asc":
      return { name: 1, _id: 1 };

    case "name_desc":
      return { name: -1, _id: -1 };

    case "latest":
      return { createdAt: -1, _id: -1 };

    case "oldest":
      return { createdAt: 1, _id: 1 };

    default:
      return { _id: 1 };
  }
}
const RoleServices = {
  async createRole({ payload, createdBy }) {
    const { name, description, isSystemRole } = payload;

    const normalizedName = name?.trim();

    if (!normalizedName) {
      throw new AppError(
        ROLE_CODES.ROLE_NAME_REQUIRED,
        "Tên vai trò là bắt buộc",
        400
      );
    }

    const existed = await Role.findOne({ name: normalizedName }).lean();

    if (existed) {
      throw new AppError(ROLE_CODES.ROLE_EXISTS, "Role đã tồn tại", 409);
    }

    const created = await Role.create({
      name: normalizedName,
      description: description || "",
      isSystemRole: isSystemRole ?? false,
      createdBy,
      updatedBy: createdBy,
    });

    await saveAuditLogs({
      entityType: "roles",
      entityId: created._id,
      action: "create",
      oldData: {},
      newData: mapRole(created),
      updatedBy: createdBy,
    });

    return mapRole(created);
  },
  async bulkCreateRoles(inputList = [], updatedBy) {
    if (!Array.isArray(inputList) || inputList.length === 0) {
      throw new AppError(
        ROLE_CODES.ROLE_BULK_INVALID_PAYLOAD,
        "Danh sách role không hợp lệ"
      );
    }

    const validItems = [];
    const errors = [];

    // Validate từng dòng
    inputList.forEach((item, index) => {
      const { error, value } = roleValidator.validate(item, {
        abortEarly: false,
      });

      if (error) {
        errors.push({
          index,
          name: item?.name || null,
          code: ROLE_CODES.ROLE_BULK_VALIDATION_FAILED,
          reason: error.details.map((d) => d.message),
        });
      } else {
        validItems.push(value);
      }
    });

    // Chặn trùng trong file
    const seen = new Set();
    const uniqueValidItems = [];

    validItems.forEach((item) => {
      if (seen.has(item.name)) {
        errors.push({
          name: item.name,
          code: ROLE_CODES.ROLE_DUPLICATE_IN_FILE,
          reason: ["Role bị trùng trong file import"],
        });
      } else {
        seen.add(item.name);
        uniqueValidItems.push(item);
      }
    });

    // Check trùng DB
    const names = uniqueValidItems.map((i) => i.name);
    const existingRoles = names.length
      ? await Role.find({ name: { $in: names } }).lean()
      : [];

    const existingSet = new Set(existingRoles.map((r) => r.name));

    const toCreate = [];
    const skipped = [];

    uniqueValidItems.forEach((item) => {
      if (existingSet.has(item.name)) {
        skipped.push({
          name: item.name,
          code: ROLE_CODES.ROLE_ALREADY_EXISTS,
        });
      } else {
        toCreate.push(item);
      }
    });

    // Insert
    const created = await this.createManyRoles(toCreate);

    // Audit log
    await Promise.all(
      created.map((role) =>
        saveAuditLogs({
          entityType: "roles",
          entityId: role.id,
          oldData: {},
          newData: role,
          updatedBy,
        })
      )
    );

    // KHÔNG success / code ở đây
    return {
      created,
      skipped,
      errors,
      summary: {
        total: inputList.length,
        created: created.length,
        skipped: skipped.length,
        failed: errors.length,
      },
    };
  },

  async createManyRoles(dataList = []) {
    if (!Array.isArray(dataList) || dataList.length === 0) return [];

    const docs = dataList.map((item) => ({
      name: item.name,
      description: item.description || "",
      isSystemRole: item.isSystemRole ?? false,
    }));

    const created = await Role.insertMany(docs, {
      ordered: false,
    });

    return created.map((doc) => mapRole(doc));
  },

  async listAdminRolesUseCase({ query }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    // Lọc theo vai trò
    if (query.isSystemRole && query.isSystemRole !== "All") {
      filter.isSystemRole = query.isSystemRole === "true";
    }

    // Tìm kiếm
    if (query.search?.trim()) {
      filter.name = {
        $regex: query.search.trim(),
        $options: "i",
      };
    }

    // sắp xếp
    const sort = buildRoleSort(query.sort);

    const [roles, total] = await Promise.all([
      Role.find(filter).sort(sort).skip(skip).limit(limit).lean(),

      Role.countDocuments(filter),
    ]);

    return {
      data: roles.map(mapRole),

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

  async getRoleById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const role = await Role.findById(id);
    return role ? mapRole(role) : null;
  },
  async countUsersByRole(roleId) {
    return await User.countDocuments({ role: roleId });
  },

  async updateRole({ id, payload, user }) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(ROLE_CODES.ROLE_ID_INVALID, "ID role không hợp lệ");
    }

    const oldRole = await Role.findById(id).lean();
    if (!oldRole) {
      throw new AppError(ROLE_CODES.ROLE_NOT_FOUND, "Không tìm thấy role");
    }

    const updatedRole = await Role.findByIdAndUpdate(
      id,
      {
        name: payload.name,
        description: payload.description,
        isSystemRole: payload.isSystemRole,
        updatedBy: user.id,
      },
      { new: true }
    ).lean();

    await saveAuditLogs({
      entityType: "roles",
      entityId: id,
      action: "update",
      oldData: oldRole,
      newData: updatedRole,
      updatedBy: user.id,
    });

    return mapRole(updatedRole);
  },

  async getRolesForExport({ scope, selectedIds, filters, search }) {
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (typeof filters?.isSystemRole === "boolean") {
      query.isSystemRole = filters.isSystemRole;
    }

    if (scope === "SELECTED") {
      query._id = { $in: selectedIds };
    }

    const roles = await Role.find(query).sort({ createdAt: -1 }).lean();

    return roles.map(mapRole);
  },

  async previewExportRoles({ payload }) {
    const { scope, selectedIds = [], filters = {}, search } = payload;
    validateExportScope({ scope, selectedIds });

    const roles = await this.getRolesForExport({
      scope,
      selectedIds,
      filters,
      search,
    });

    if (!roles.length) {
      throw new AppError(
        ROLE_CODES.ROLE_EXPORT_EMPTY,
        "Không có dữ liệu để xem trước",
        404
      );
    }

    return {
      total: roles.length,
      columns: ["name", "description", "isSystemRole", "createdAt"],
      preview: roles.slice(0, 10).map((r) => ({
        id: r.id, // ✅ sửa
        name: r.name,
        description: r.description,
        isSystemRole: r.isSystemRole,
        createdAt: r.createdAt,
      })),
    };
  },

  async exportRoles({ payload, user }) {
    const { scope, selectedIds, filters, format } = payload;

    validateExportScope({ scope, selectedIds });
    validateExportFormat(format);

    const roles = await this.getRolesForExport({ scope, selectedIds, filters });

    if (!roles.length) {
      throw new AppError(
        ROLE_CODES.ROLE_EXPORT_EMPTY,
        "Không có dữ liệu để export",
        404
      );
    }

    const buffer = await exportRoles({ roles, format });

    return {
      buffer,
      fileName: `roles_${Date.now()}.${format === "excel" ? "xlsx" : "pdf"}`,
      contentType:
        format === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
    };
  },

  async deleteManyRoles(ids = [], deletedBy) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError(
        ROLE_CODES.ROLE_DELETE_MANY_INVALID_PAYLOAD,
        "Danh sách role không hợp lệ"
      );
    }

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (validIds.length === 0) {
      throw new AppError(
        ROLE_CODES.ROLE_DELETE_MANY_INVALID_PAYLOAD,
        "Danh sách role không hợp lệ"
      );
    }

    const roles = await Role.find({ _id: { $in: validIds } }).lean();

    if (roles.length !== validIds.length) {
      throw new AppError(
        ROLE_CODES.ROLE_DELETE_MANY_NOT_FOUND,
        "Một hoặc nhiều role không tồn tại"
      );
    }

    await Role.deleteMany({ _id: { $in: validIds } });

    // audit log
    await Promise.all(
      roles.map((role) =>
        saveAuditLogs({
          entityType: "roles",
          entityId: role._id,
          oldData: mapRole(role),
          newData: {},
          updatedBy: deletedBy,
          action: "delete",
          timestamp: Date.now(),
        })
      )
    );

    return {
      deletedIds: validIds,
    };
  },
  async getRoleByName(name) {
    return await Role.findOne({ name }); // trả raw mongoose doc
  },

  async getDefaultRoleId(defaultRoleName = "student") {
    const role = await Role.findOne({ name: defaultRoleName });
    return role?._id || null;
  },
  async handleRoleChange(user, newRoleId) {
    const role = await Role.findById(newRoleId);
    if (!role) {
      throw new AppError(ROLE_CODES.ROLE_NOT_FOUND, "Role không tồn tại");
    }

    // check role có nằm trong danh sách không
    const hasRole = user.role_ids?.some(
      (id) => id.toString() === newRoleId.toString()
    );

    if (!hasRole) {
      throw new AppError(
        ROLE_CODES.ROLE_NOT_ASSIGNED,
        "User chưa được gán role này"
      );
    }

    // check nếu đang active rồi thì bỏ qua
    if (user.active_role_id?.toString() === newRoleId.toString()) {
      return;
    }

    // set role active
    user.active_role_id = role._id;

    // sync permission nếu có
    if (role.permissions) {
      user.permissions = role.permissions;
    }

    await saveAuditLogs({
      action: "USER_ROLE_CHANGED",
      userId: user._id,
      metadata: {
        newRoleId: role._id,
      },
    });
  },
};

export default RoleServices;
