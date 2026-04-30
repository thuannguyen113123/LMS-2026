import RolePermission from "../../models/roleAndPermisson/RolePermission.model.js";
import Role from "../../models/role/role.model.js";

import mongoose from "mongoose";

export async function getPermissionsByRole(roleName) {
  const role = await Role.findOne({ name: roleName }).lean();
  if (!role) return [];

  const rolePerm = await RolePermission.findOne({
    roleId: role._id,
  })
    .populate("permissionIds", "code")
    .lean();

  if (!rolePerm || !rolePerm.permissionIds) return [];

  return rolePerm.permissionIds.map((p) => p.code);
}

const RolePermissionModel = {
  // Gán 1 permission cho role
  async assignPermissionToRole({ roleId, permissionId, assignedBy }) {
    const newRecord = new RolePermission({
      roleId,
      permissionId,
      assignedBy,
    });
    return await newRecord.save();
  },

  // Gán nhiều permission cho role
  async assignMany(list = []) {
    if (!Array.isArray(list) || list.length === 0) return [];

    const records = list.map((item) => ({
      ...item,
      assignedAt: new Date(),
    }));

    return await RolePermission.insertMany(records);
  },

  // Lấy danh sách theo roleId hoặc tất cả, có phân trang
  async getList({ roleId = "All", limit = 10, page = 1 }) {
    const filter = roleId === "All" ? {} : { roleId };

    const data = await RolePermission.find(filter)
      .sort({ assignedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await RolePermission.countDocuments(filter);

    return {
      data,
      total,
      hasNextPage: page * limit < total,
      currentPage: page,
    };
  },
  // Lấy tất cả quyền hiện tại của user
  async getByUserId(userId) {
    return await RolePermission.find({ userId }).lean();
  },
  // Cập nhật roles và permissions cho user (xoá cũ, gán mới)
  async updateRolePermissions({
    roleId,
    permissionIds = [],
    assignedBy = null,
  }) {
    if (!roleId) throw new Error("roleId là bắt buộc");

    // Ép kiểu cho chắc chắn
    const cleanPermissionIds = permissionIds.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    // Xóa quyền cũ
    await RolePermission.deleteMany({ roleId });

    // Tạo doc mới (1 role = 1 dòng)
    const newRecord = new RolePermission({
      roleId,
      permissionIds: cleanPermissionIds,
      assignedBy,
      assignedAt: new Date(),
    });

    const inserted = await newRecord.save();
    return inserted.toObject();
  },

  // Lấy theo ID
  async getById(id) {
    return await RolePermission.findById(id).lean();
  },
  // Thêm vào RolePermissionModel
  async findOne(filter = {}) {
    return await RolePermission.findOne(filter).lean();
  },

  // Xoá theo ID
  async delete(id) {
    const result = await RolePermission.findByIdAndDelete(id);
    return result ? true : false;
  },

  // Xoá nhiều ID
  async deleteMany(ids = []) {
    if (!Array.isArray(ids) || ids.length === 0) return false;

    const result = await RolePermission.deleteMany({ _id: { $in: ids } });
    return result.deletedCount > 0;
  },
};

export default RolePermissionModel;
