import Joi from "joi";

// 📌 Schema để gán 1 quyền cho 1 role
export const rolePermissionSchema = Joi.object({
  roleId: Joi.string().min(3).optional().messages({
    "string.base": "Role ID phải là chuỗi",
    "string.empty": "Role ID không được để trống",
    "string.min": "Role ID phải có ít nhất 3 ký tự",
  }),
  permissionId: Joi.string().min(3).optional().messages({
    "string.base": "Permission ID phải là chuỗi",
    "string.empty": "Permission ID không được để trống",
    "string.min": "Permission ID phải có ít nhất 3 ký tự",
  }),
  assignedBy: Joi.string().optional().allow(null, "").messages({
    "string.base": "AssignedBy phải là chuỗi",
  }),
})
  .or("roleId", "permissionId") // Ít nhất 1 trong 2 phải có
  .messages({
    "object.missing": "Phải có ít nhất roleId hoặc permissionId",
  });

// 📌 Schema query để lấy danh sách role_permissions (phân trang)
export const rolePermissionListQuerySchema = Joi.object({
  roleId: Joi.string().optional().allow("All"),
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    "number.base": "Limit phải là số",
    "number.min": "Limit tối thiểu là 1",
    "number.max": "Limit tối đa là 100",
  }),
  startAfterId: Joi.string().optional().allow(null, "").messages({
    "string.base": "startAfterId phải là chuỗi",
  }),
  search: Joi.string().optional().allow("").messages({
    "string.base": "Search phải là chuỗi",
  }),
});
