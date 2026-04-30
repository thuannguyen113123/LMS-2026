import Joi from "joi";

/**
 * =========================
 * ✅ CREATE MODULE
 * =========================
 */
export const createModuleSchema = Joi.object({
  name: Joi.string().trim().min(1).required().messages({
    "string.base": "Tên module phải là chuỗi",
    "string.empty": "Tên module không được để trống",
    "any.required": "Tên module là bắt buộc",
  }),
  group: Joi.string()
    .valid("main", "management", "others")
    .default("main")
    .messages({
      "any.only": "Group không hợp lệ",
    }),

  visibility: Joi.string()
    .valid("admin", "public", "instructor", "both")
    .default("admin")
    .messages({
      "any.only": "visibility không hợp lệ",
    }),
  code: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9-_]+$/)
    .required()
    .messages({
      "string.base": "Code module phải là chuỗi",
      "string.empty": "Code module không được để trống",
      "string.pattern.base": "Code chỉ được chứa chữ thường, số, - hoặc _",
      "any.required": "Code module là bắt buộc",
    }),

  description: Joi.string().allow("").default("").messages({
    "string.base": "Mô tả phải là chuỗi",
  }),

  icon: Joi.string().allow("").default("").messages({
    "string.base": "Icon phải là chuỗi",
  }),

  path: Joi.string().allow("").default("").messages({
    "string.base": "Path phải là chuỗi",
  }),

  order: Joi.number().integer().min(0).default(0).messages({
    "number.base": "Order phải là số",
    "number.min": "Order không được nhỏ hơn 0",
  }),

  isActive: Joi.boolean().default(true).messages({
    "boolean.base": "isActive phải là true hoặc false",
  }),

  isSystemModule: Joi.boolean().default(false).messages({
    "boolean.base": "isSystemModule phải là true hoặc false",
  }),
}).unknown(false);

/**
 * =========================
 * ✅ UPDATE MODULE
 * =========================
 * ❌ Không enforce rule system module ở đây
 * 👉 xử lý ở controller (giống course)
 */
export const updateModuleSchema = Joi.object({
  _id: Joi.string().optional(),
  __v: Joi.number().optional(),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
  slug: Joi.string().optional(),

  name: Joi.string().trim().min(1).optional().messages({
    "string.base": "Tên module phải là chuỗi",
    "string.empty": "Tên module không được để trống",
  }),
  group: Joi.string()
    .valid("main", "management", "others")
    .optional()
    .messages({
      "any.only": "Group không hợp lệ",
    }),
  sidebarPermission: Joi.string().trim().allow(null, "").optional(),

  visibility: Joi.string()
    .valid("admin", "public", "instructor", "both")
    .optional(),
  code: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9-_]+$/)
    .optional()
    .messages({
      "string.pattern.base": "Code chỉ được chứa chữ thường, số, - hoặc _",
    }),

  description: Joi.string().allow("").optional(),

  icon: Joi.string().allow("").optional(),

  path: Joi.string().allow("").optional(),

  order: Joi.number().integer().min(0).optional(),

  isActive: Joi.boolean().optional(),

  isSystemModule: Joi.boolean().optional(),
}).unknown(false);

/**
 * =========================
 * ✅ SORT MODULE (drag & drop)
 * =========================
 */
export const sortModuleSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().required().messages({
          "any.required": "Thiếu id module",
        }),
        order: Joi.number().integer().required().messages({
          "number.base": "Order phải là số",
          "any.required": "Order là bắt buộc",
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.base": "Items phải là mảng",
      "array.min": "Phải có ít nhất 1 module để sắp xếp",
      "any.required": "Items là bắt buộc",
    }),
}).unknown(false);

/**
 * =========================
 * ✅ TOGGLE ACTIVE
 * =========================
 */
export const toggleModuleSchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    "boolean.base": "isActive phải là true hoặc false",
    "any.required": "isActive là bắt buộc",
  }),
}).unknown(false);
