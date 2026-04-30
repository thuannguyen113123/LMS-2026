import Joi from "joi";

export const createCommentSchema = Joi.object({
  targetType: Joi.string().valid("course", "lesson", "home").required(),

  targetId: Joi.string().hex().length(24).required(),

  parentId: Joi.string().hex().length(24).allow(null).optional(),

  content: Joi.string().trim().min(1).max(2000).required().messages({
    "string.empty": "Nội dung không được để trống",
  }),

  attachments: Joi.array()
    .max(5)
    .items(
      Joi.object({
        type: Joi.string().valid("image", "file", "video", "audio").required(),

        url: Joi.string().uri().required(),

        filename: Joi.string().max(255).required(),

        size: Joi.number()
          .integer()
          .max(10 * 1024 * 1024)
          .required(), // 10MB
      })
    )
    .optional(),
}).unknown(false);

// Schema cho query params lấy danh sách bình luận
export const listQuerySchema = Joi.object({
  courseId: Joi.string().hex().length(24).required().messages({
    "string.length": "courseId phải là ObjectId hợp lệ 24 ký tự",
    "any.required": "courseId là bắt buộc",
  }),
  limit: Joi.number().integer().min(1).max(100).optional(),
  startAfterId: Joi.string().hex().length(24).optional().allow(null, ""),
});
