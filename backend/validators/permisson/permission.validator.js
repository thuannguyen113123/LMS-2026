import Joi from "joi";

export const permissionSchema = Joi.object({
  name: Joi.string().trim().min(1).required().messages({
    "string.empty": "Tên quyền không được để trống",
    "any.required": "Tên quyền là bắt buộc",
  }),
  code: Joi.string().trim().required().messages({
    "string.empty": "Mã quyền không được để trống",
    "any.required": "Mã quyền là bắt buộc",
  }),
  description: Joi.string().allow("").optional(),
  category: Joi.string()

    .valid(
      "read",
      "write",
      "update",
      "delete",
      "admin",
      "access",
      "export",
      "other"
    )
    .required()
    .messages({
      "any.only": "Category không hợp lệ",
      "any.required": "Category là bắt buộc",
    }),
  isSystemPermission: Joi.boolean().optional(),
  moduleId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Module không hợp lệ",
      "any.required": "Module là bắt buộc",
    }),
});
export const permissionBulkSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),

  code: Joi.string().trim().uppercase().required(),

  description: Joi.string().allow("").optional(),

  category: Joi.string()
    .valid("read", "write", "update", "delete", "admin", "export", "other")
    .required(),

  isSystemPermission: Joi.boolean().optional(),

  // 🔥 dùng moduleName thay vì moduleId
  moduleName: Joi.string().trim().required().messages({
    "string.empty": "Tên module không được để trống",
    "any.required": "Module là bắt buộc",
  }),
});

export const permissionUpdateSchema = Joi.object({
  name: Joi.string().trim().min(1).optional().messages({
    "string.empty": "Tên quyền không được để trống",
  }),

  // Nếu KHÔNG cho sửa code → xoá field này
  code: Joi.string().trim().optional().messages({
    "string.empty": "Mã quyền không được để trống",
  }),

  description: Joi.string().allow("").optional(),

  category: Joi.string()
    .valid("read", "write", "update", "delete", "admin", "export", "other")
    .optional()
    .messages({
      "any.only": "Category không hợp lệ",
    }),

  isSystemPermission: Joi.boolean().optional(),

  moduleId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "Module không hợp lệ",
    }),
})
  .min(1)
  .options({ stripUnknown: true });
