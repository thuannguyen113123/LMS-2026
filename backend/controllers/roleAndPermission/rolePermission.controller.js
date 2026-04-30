import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import RolePermissionServices from "../../services/RolePermission/RolePermissionServices.js";
import { rolePermissionSchema } from "../../validators/roleAndPermisson/rolePermission.validator.js";

const mapDoc = (doc) => {
  if (doc?.toObject) doc = doc.toObject();
  const { _id, __v, ...rest } = doc;
  return { id: _id.toString(), ...rest };
};

const getUserIdentifier = (user) => user?.email || user?.phone || "unknown";

export const rolePermissionController = {
  async assign(req, res) {
    try {
      const { error, value } = rolePermissionSchema.validate(req.body);
      if (error)
        return res.status(400).json({ error: error.details[0].message });

      const created = await RolePermissionServices.assignPermissionToRole(
        value
      );
      const mapped = mapDoc(created);

      await saveAuditLogs({
        entityType: "role_permissions",
        entityId: mapped.id,
        oldData: {},
        newData: mapped,
        updatedBy: getUserIdentifier(req.user),
      });

      return res.status(201).json({ success: true, data: mapped });
    } catch (err) {
      console.error("Assign role permission error:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
  },

  // Gán nhiều quyền cho role
  async assignMany(req, res) {
    try {
      const list = req.body;
      if (!Array.isArray(list) || list.length === 0) {
        return res
          .status(400)
          .json({ error: "Dữ liệu phải là mảng không rỗng" });
      }

      const validList = [];
      for (const item of list) {
        const { error, value } = rolePermissionSchema.validate(item);
        if (error) {
          return res.status(400).json({
            error: `Lỗi ở mục roleId=${item.roleId || "?"} - ${
              error.details[0].message
            }`,
          });
        }
        validList.push(value);
      }

      const createdList = await RolePermissionServices.assignMany(validList);
      const mappedList = createdList.map(mapDoc);

      await Promise.all(
        mappedList.map((item) =>
          saveAuditLogs({
            entityType: "role_permissions",
            entityId: item.id,
            oldData: {},
            newData: item,
            updatedBy: getUserIdentifier(req.user),
          })
        )
      );

      return res.status(201).json({ success: true, data: mappedList });
    } catch (err) {
      console.error("Assign many role permissions error:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
  },
  // Cập nhật lại toàn bộ quyền của 1 role
  async updateRolePermissions(req, res) {
    try {
      const { roleId } = req.params;
      const { permissionIds = [] } = req.body;

      if (!roleId) {
        return res.status(400).json({ error: "Thiếu roleId" });
      }

      const oldData = await RolePermissionServices.findOne({ roleId });

      const updated = await RolePermissionServices.updateRolePermissions({
        roleId,
        permissionIds,
        assignedBy: req.user._id,
      });

      await saveAuditLogs({
        entityType: "role_permissions",
        entityId: roleId,
        oldData: oldData || {},
        newData: updated,
        updatedBy: req.user._id,
        action: "update",
      });

      return res.json({
        success: true,
        message: "Cập nhật quyền cho role thành công",
        data: updated,
      });
    } catch (err) {
      console.error("Update role permissions error:", err);
      return res.status(500).json({ error: "Lỗi server khi cập nhật quyền" });
    }
  },

  // Lấy danh sách quyền theo Role ID
  async getByRoleId(roleId) {
    if (!roleId) throw new Error("Thiếu roleId");
    return await RolePermission.find({ roleId }).populate("permissionId");
  },
  // Lấy danh sách
  async list(req, res) {
    try {
      const { roleId = "All", limit = 10, page = 1, search = "" } = req.query;

      const { data, hasNextPage, currentPage } =
        await RolePermissionServices.getList({
          roleId,
          limit: parseInt(limit),
          page: parseInt(page),
        });

      let filtered = data;
      if (search) {
        filtered = data.filter(
          (item) =>
            item.roleId?.toLowerCase().includes(search.toLowerCase()) ||
            item.permissionId?.toLowerCase().includes(search.toLowerCase())
        );
      }

      return res.json({
        success: true,
        data: filtered.map(mapDoc),
        currentPage,
        hasNextPage,
        limit,
      });
    } catch (err) {
      console.error("List role permissions error:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
  },

  // Xoá 1 quyền
  async remove(req, res) {
    try {
      const { id } = req.params;

      const oldData = await RolePermissionServices.getById(id);
      if (!oldData) {
        return res.status(404).json({ error: "Không tìm thấy dữ liệu" });
      }

      await RolePermissionServices.delete(id);

      await saveAuditLogs({
        entityType: "role_permissions",
        entityId: id,
        oldData: mapDoc(oldData),
        newData: {},
        updatedBy: getUserIdentifier(req.user),
        action: "delete",
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("Delete role permission error:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
  },

  // Xoá nhiều quyền
  async removeMany(req, res) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Danh sách IDs không hợp lệ" });
      }

      const oldDataList = await Promise.all(
        ids.map((id) => RolePermissionServices.getById(id))
      );

      const notFoundIds = ids.filter((id, index) => !oldDataList[index]);
      if (notFoundIds.length > 0) {
        return res.status(404).json({
          error: `Không tìm thấy các mục với id: ${notFoundIds.join(", ")}`,
        });
      }

      await RolePermissionServices.deleteMany(ids);

      await Promise.all(
        ids.map((id, index) =>
          saveAuditLogs({
            entityType: "role_permissions",
            entityId: id,
            oldData: mapDoc(oldDataList[index]),
            newData: {},
            updatedBy: getUserIdentifier(req.user),
            action: "delete",
          })
        )
      );

      return res.json({ success: true, deletedIds: ids });
    } catch (err) {
      console.error("Delete many role permissions error:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
  },
  async getUserRolePermissions(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ error: "Thiếu userId" });
      }

      const data = await RolePermissionServices.getByUserId(userId);

      const mapped = Array.isArray(data) ? data.map(mapDoc) : [];

      return res.json({
        success: true,
        data: mapped,
      });
    } catch (err) {
      console.error("Get user role permissions error:", err);
      return res.status(500).json({ error: "Lỗi server" });
    }
  },
};
