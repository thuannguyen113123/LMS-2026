import Joi from "joi";

export const roleValidator = Joi.object({
  name: Joi.string().trim().lowercase().min(2).max(50).required().messages({
    "string.empty": "Tên vai trò là bắt buộc.",
    "string.min": "Tên vai trò phải có ít nhất 2 ký tự.",
    "string.max": "Tên vai trò không vượt quá 50 ký tự.",
  }),

  description: Joi.string().allow("").default(""),

  isSystemRole: Joi.boolean().default(false),
});
