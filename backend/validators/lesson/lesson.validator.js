import Joi from "joi";

// =========================================================
// VALIDATOR: CREATE LESSON
// =========================================================
export const lessonSchema = Joi.object({
  title: Joi.string().trim().min(1).required(),
  course: Joi.string().trim().required(),
  status: Joi.string()
    .valid("Draft", "Published") // hoặc "draft", "published" tùy convention
    .default("Draft")
    .messages({
      "any.only": "Trạng thái bài học không hợp lệ",
    }),
  content: Joi.string().allow("").default(""),
  videoUrl: Joi.string().uri().allow("").default(""),
  order: Joi.number().integer().min(0).default(0),
  duration: Joi.number().min(0).default(0),
  isPublished: Joi.boolean().default(false),
  createdAt: Joi.date().optional(),
}).unknown(false);

// =========================================================
// VALIDATOR: UPDATE LESSON
// =========================================================
export const updateLessonSchema = Joi.object({
  _id: Joi.string().optional(),
  __v: Joi.number().optional(),
  slug: Joi.string().optional(),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),

  title: Joi.string().trim().min(1).optional().messages({
    "string.empty": "Tiêu đề bài học không hợp lệ",
  }),

  course: Joi.alternatives()
    .try(
      Joi.string(), // nếu chỉ gửi _id
      Joi.object({
        id: Joi.string().required(), // bắt buộc có _id
      }).unknown(true) // cho phép các key khác như title, slug, ...
    )
    .optional(),

  content: Joi.string().allow("").optional(),

  videoUrl: Joi.string().uri().allow("").optional().messages({
    "string.uri": "Link video không hợp lệ",
  }),

  order: Joi.number().integer().min(0).optional(),

  duration: Joi.number().min(0).optional(),

  isPublished: Joi.boolean().optional(),
}).unknown(false);

export const lessonBulkItemSchema = Joi.object({
  title: Joi.string().trim().required(),

  content: Joi.string().allow("").optional(),
  videoUrl: Joi.string().allow("").optional(),

  order: Joi.number().min(1).optional(),
  duration: Joi.number().min(0).optional(),

  isPublished: Joi.boolean().optional(),

  courseSlug: Joi.string().trim().required().messages({
    "any.required": "Thiếu courseSlug",
  }),
}).options({ stripUnknown: true });

export const lessonBulkSchema = Joi.array().items(lessonBulkItemSchema).min(1);

// =========================================================
// VALIDATOR: BULK IMPORT (array)
// =========================================================
export const lessonArraySchema = Joi.array()
  .items(lessonSchema)
  .min(1)
  .messages({
    "array.min": "Dữ liệu đầu vào phải có ít nhất 1 bài học",
    "array.base": "Dữ liệu đầu vào phải là mảng",
  });
