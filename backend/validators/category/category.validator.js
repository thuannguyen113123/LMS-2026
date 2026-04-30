import Joi from "joi";

export const categorySchema = Joi.object({
  name: Joi.string().trim().min(1).required().messages({
    "string.empty": "Tên danh mục không được để trống",
    "any.required": "Tên danh mục là bắt buộc",
  }),
  description: Joi.string().allow("").optional(),
  status: Joi.string().valid("active", "inactive").optional(),
}).unknown(false);

// Joi validate cho cập nhật
export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).optional(),
  description: Joi.string().allow("").optional(),
  status: Joi.string().valid("active", "inactive").optional(),
}).unknown(false);

// ✅ Dùng cho bulk import (mảng nhiều danh mục)
export const categoryArraySchema = Joi.array()
  .items(categorySchema)
  .min(1)
  .messages({
    "array.min": "Dữ liệu đầu vào phải có ít nhất 1 danh mục",
    "array.base": "Dữ liệu đầu vào phải là mảng",
  });
