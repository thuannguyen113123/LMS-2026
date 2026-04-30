import Joi from "joi";

export const instructorSchema = Joi.object({
  // Thông tin cơ bản
  user: Joi.string().required(),
  fullname: Joi.string().required(),
  bio: Joi.string().allow("").optional(),
  specialization: Joi.string().allow("").optional(),
  phone: Joi.string().allow("").optional(),

  // Avatar
  avatar: Joi.string().allow("").optional(),

  // Trạng thái và thống kê
  totalStudents: Joi.number().integer().min(0).default(0).optional(),

  // ✅ Rating trong dữ liệu thực là object { average, count }
  rating: Joi.object({
    average: Joi.number().min(0).max(5).default(0),
    count: Joi.number().integer().min(0).default(0),
  }).optional(),

  // 🔹 Trường bổ sung cho tương thích
  ratingAverage: Joi.string().allow("").optional(),
  ratingCount: Joi.number().allow("").optional(),
  coursesTaughtCount: Joi.number().integer().min(0).default(0).optional(),

  // Danh sách khóa học giảng dạy
  coursesTaught: Joi.array().items(Joi.string()).default([]).optional(),

  // Mạng xã hội & liên kết
  github: Joi.string().allow("").optional(),
  linkedin: Joi.string().allow("").optional(),
  youtube: Joi.string().allow("").optional(),
  website: Joi.string().allow("").optional(),

  // SocialLinks thực tế có dạng object
  socialLinks: Joi.object({
    github: Joi.string().allow(""),
    linkedin: Joi.string().allow(""),
    youtube: Joi.string().allow(""),
    website: Joi.string().allow(""),
  }).optional(),

  // Các trường meta
  slug: Joi.string().allow("").optional(),
  expertise: Joi.array().items(Joi.string()).optional(),
  createdAt: Joi.string().optional(),
  updatedAt: Joi.string().optional(),
  email: Joi.string().email().allow("").optional(),
});

export const instructorBulkItemSchema = Joi.object({
  userEmail: Joi.string().email().required().messages({
    "any.required": "Thiếu email user",
    "string.email": "Email user không hợp lệ",
  }),

  bio: Joi.string().allow("").optional(),
  specialization: Joi.string().allow("").optional(),
  phone: Joi.string().allow("").optional(),
  avatar: Joi.string().allow("").optional(),

  expertise: Joi.array().items(Joi.string()).optional(),

  github: Joi.string().allow("").optional(),
  linkedin: Joi.string().allow("").optional(),
  youtube: Joi.string().allow("").optional(),
  website: Joi.string().allow("").optional(),
}).options({ stripUnknown: true });

export const instructorBulkSchema = Joi.array()
  .items(instructorBulkItemSchema)
  .min(1)
  .messages({
    "array.base": "Payload phải là mảng instructor",
    "array.min": "Danh sách instructor rỗng",
  });

export const updateInstructorSchema = Joi.object({
  _id: Joi.string().optional(),
  __v: Joi.number().optional(),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
  slug: Joi.string().optional(),
  fullname: Joi.string().optional(),
  bio: Joi.string().allow("").optional(),
  specialization: Joi.string().allow("").optional(),

  expertise: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .optional(),
  totalStudents: Joi.number().integer().min(0).optional(),

  rating: Joi.object({
    average: Joi.number().min(0).max(5).optional(),
    count: Joi.number().integer().min(0).optional(),
  }).optional(),

  socialLinks: Joi.object({
    website: Joi.string().allow("").optional(),
    linkedin: Joi.string().allow("").optional(),
    youtube: Joi.string().allow("").optional(),
    github: Joi.string().allow("").optional(),
  }).optional(),

  coursesTaught: Joi.array()
    .items(
      Joi.object({
        course: Joi.string().required(),
        assignedAt: Joi.date().optional(),
        status: Joi.string().valid("active", "draft", "archived").optional(),
      })
    )
    .optional(),
}).unknown(false);
