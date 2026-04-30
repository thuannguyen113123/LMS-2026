import Joi from "joi";

export const studentSchema = Joi.object({
  user: Joi.string().required(),

  bio: Joi.string().allow(""),
  enrolledCourses: Joi.array().items(
    Joi.object({
      course: Joi.string(),
      progress: Joi.number().min(0).max(100),
    })
  ),
  preferences: Joi.object({
    language: Joi.string().valid("vi", "en").default("vi"),
    notifications: Joi.boolean().default(true),
    darkMode: Joi.boolean().default(false),
  }).optional(),
});
export const studentBulkItemSchema = Joi.object({
  userEmail: Joi.string().email().required().messages({
    "any.required": "Thiếu userEmail",
    "string.email": "userEmail không hợp lệ",
  }),

  language: Joi.string().valid("vi", "en").optional(),

  notifications: Joi.boolean().optional(),

  darkMode: Joi.boolean().optional(),
}).options({ stripUnknown: true });

export const studentBulkSchema = Joi.array()
  .items(studentBulkItemSchema)
  .min(1)
  .messages({
    "array.base": "Payload phải là mảng student",
    "array.min": "Danh sách student rỗng",
  });
