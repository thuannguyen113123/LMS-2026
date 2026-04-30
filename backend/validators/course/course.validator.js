import Joi from "joi";

// ✅ Schema cho tạo mới khóa học
export const courseSchema = Joi.object({
  title: Joi.string().trim().min(1).required().messages({
    "string.empty": "Tiêu đề khóa học không được để trống",
    "any.required": "Tiêu đề khóa học là bắt buộc",
  }),
  whatYouWillLearn: Joi.array()
    .items(Joi.string().trim())
    .default([])
    .messages({
      "array.base": "whatYouWillLearn phải là một mảng",
      "string.base": "Mỗi mục trong whatYouWillLearn phải là chuỗi",
    }),

  audience: Joi.array().items(Joi.string().trim()).default([]).messages({
    "array.base": "Audience phải là một mảng",
    "string.base": "Mỗi mục audience phải là chuỗi",
  }),

  requirements: Joi.array().items(Joi.string().trim()).default([]).messages({
    "array.base": "Requirements phải là một mảng",
    "string.base": "Mỗi mục requirements phải là chuỗi",
  }),

  category: Joi.string().trim().required().messages({
    "string.empty": "Danh mục là bắt buộc",
    "any.required": "Danh mục là bắt buộc",
  }),

  rating: Joi.number().min(0).max(5).default(0).messages({
    "number.base": "Đánh giá phải là số",
    "number.min": "Đánh giá không thể nhỏ hơn 0",
    "number.max": "Đánh giá không thể lớn hơn 5",
  }),

  description: Joi.string().allow("").default("").messages({
    "string.base": "Mô tả phải là chuỗi ký tự",
  }),

  duration: Joi.number().positive().required().messages({
    "number.base": "Thời lượng phải là số",
    "any.required": "Thời lượng là bắt buộc",
  }),

  status: Joi.string()
    .valid("draft", "published")
    .lowercase()
    .default("draft")
    .messages({
      "any.only": "Trạng thái phải là 'draft' hoặc 'published'",
    }),

  coverImage: Joi.string().uri().required().messages({
    "string.uri": "Ảnh bìa phải là đường dẫn hợp lệ",
    "any.required": "Ảnh bìa là bắt buộc",
  }),

  price: Joi.alternatives().conditional("isFree", {
    is: true,
    then: Joi.alternatives()
      .try(Joi.number().valid(0), Joi.string().valid(""))
      .default(0),
    otherwise: Joi.number().min(0).required(),
  }),

  discountPrice: Joi.alternatives().conditional("isFree", {
    is: true,
    then: Joi.alternatives()
      .try(Joi.number().valid(0), Joi.string().valid(""))
      .default(0),
    otherwise: Joi.number().min(0),
  }),

  isFree: Joi.boolean().default(false),

  videoURL: Joi.string().uri().required().messages({
    "string.uri": "Link video phải là đường dẫn hợp lệ",
    "any.required": "Link video là bắt buộc",
  }),
  instructor: Joi.string().trim().required().messages({
    "string.base": "Instructor phải là chuỗi",
    "any.required": "Instructor là bắt buộc",
  }),

  createdAt: Joi.date().optional(),
}).unknown(false);

export const updateCourseSchema = Joi.object({
  _id: Joi.string().optional(), // không bắt buộc
  __v: Joi.number().optional(),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
  slug: Joi.string().optional(),

  title: Joi.string().trim().min(1).optional(),
  whatYouWillLearn: Joi.array().items(Joi.string().trim()).optional().messages({
    "array.base": "whatYouWillLearn phải là một mảng",
    "string.base": "Mỗi mục trong whatYouWillLearn phải là chuỗi",
  }),
  audience: Joi.array().items(Joi.string().trim()).optional().messages({
    "array.base": "Audience phải là một mảng",
    "string.base": "Mỗi mục audience phải là chuỗi",
  }),

  requirements: Joi.array().items(Joi.string().trim()).optional().messages({
    "array.base": "Requirements phải là một mảng",
    "string.base": "Mỗi mục requirements phải là chuỗi",
  }),

  category: Joi.alternatives()
    .try(
      Joi.string(),
      Joi.object({
        _id: Joi.string().required(),
        name: Joi.string(),
        slug: Joi.string(),
      })
    )
    .required(),
  rating: Joi.number().min(0).max(5).optional(),
  description: Joi.string().allow("").optional(),
  duration: Joi.number().positive().optional(),
  status: Joi.string().valid("draft", "published").lowercase().optional(),
  coverImage: Joi.string().uri().optional(),
  price: Joi.alternatives()
    .conditional("isFree", {
      is: true,
      then: Joi.alternatives().try(
        Joi.number().valid(0),
        Joi.string().valid("")
      ),
      otherwise: Joi.number().min(0),
    })
    .optional(),

  discountPrice: Joi.alternatives()
    .conditional("isFree", {
      is: true,
      then: Joi.alternatives().try(
        Joi.number().valid(0),
        Joi.string().valid("")
      ),
      otherwise: Joi.number().min(0),
    })
    .optional(),

  isFree: Joi.boolean().optional(),
  videoURL: Joi.string().uri().optional(),
  instructor: Joi.string().trim().required().messages({
    "string.base": "Instructor phải là chuỗi",
    "any.required": "Instructor là bắt buộc",
  }),
}).unknown(false);
export const courseBulkItemSchema = Joi.object({
  title: Joi.string().trim().min(1).required(),

  description: Joi.string().allow("").optional(),

  price: Joi.number().min(0).optional(),
  discountPrice: Joi.number().min(0).optional(),

  status: Joi.string().valid("draft", "published").optional(),

  categoryName: Joi.string().trim().required().messages({
    "any.required": "Thiếu categoryName",
  }),

  instructorName: Joi.string().trim().allow(null, "").optional(),
}).options({ stripUnknown: true });

export const courseBulkSchema = Joi.array()
  .items(courseBulkItemSchema)
  .min(1)
  .messages({
    "array.base": "Payload phải là mảng course",
    "array.min": "Danh sách course rỗng",
  });
