import Joi from "joi";
export const userCreateSchema = Joi.object({
  fullname: Joi.string().min(1).required().messages({
    "string.empty": "Tên học sinh không được để trống",
    "any.required": "Tên học sinh là bắt buộc",
  }),

  email: Joi.string().email().messages({
    "string.email": "Email không hợp lệ",
  }),

  phone: Joi.string().messages({
    "string.empty": "Số điện thoại không được để trống",
  }),

  role_id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "role_id không đúng định dạng ObjectId",
      "any.required": "role_id là bắt buộc",
    }),
})
  .or("email", "phone")
  .messages({
    "object.missing": "Phải có ít nhất Email hoặc Số điện thoại",
  });

export const userBulkSchema = Joi.object({
  fullname: Joi.string().min(1).required().messages({
    "string.empty": "Fullname không được để trống",
    "any.required": "Fullname là bắt buộc",
  }),

  email: Joi.string().email().allow(null, "").messages({
    "string.email": "Email không hợp lệ",
  }),

  phone: Joi.string().allow(null, ""),

  role: Joi.string().min(1).required().messages({
    "any.required": "Role là bắt buộc (dùng name, không dùng id)",
  }),

  isActive: Joi.boolean().default(false),
  createdAt: Joi.date().optional(),
  provider: Joi.string().valid("local").default("local"),
})
  .or("email", "phone")
  .messages({
    "object.missing": "Phải có ít nhất email hoặc phone",
  });

export const adminInlineUpdateSchema = Joi.object({
  role_id: Joi.string().hex().length(24).optional(),
  isActive: Joi.boolean().optional(),
  locked: Joi.boolean().optional(),
})
  .min(1)
  .unknown(false);
export const adminFormUpdateSchema = Joi.object({
  fullname: Joi.string().trim().min(2).max(120).required().messages({
    "string.empty": "Họ tên không được để trống",
    "string.min": "Họ tên quá ngắn",
    "any.required": "Họ tên là bắt buộc",
  }),
});
export const selfProfileUpdateSchema = Joi.object({
  fullname: Joi.string().trim().min(2).max(100),

  avatar: Joi.string().uri().allow(null),

  bio: Joi.string().max(500).allow(""),

  expertise: Joi.array().items(Joi.string().trim().max(50)).max(10),

  socialLinks: Joi.object({
    youtube: Joi.string().uri(),
    linkedin: Joi.string().uri(),
    twitter: Joi.string().uri(),
    github: Joi.string().uri(),
    website: Joi.string().uri(),
  }).optional(),
}).min(1);
