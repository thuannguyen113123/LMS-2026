// validators/quizValidator.js
import Joi from "joi";

export const quizSchema = Joi.object({
  title: Joi.string().required().messages({
    "string.empty": "Tiêu đề không được để trống",
    "any.required": "Tiêu đề là bắt buộc",
  }),
  scope: Joi.string().valid("course", "lesson").required().messages({
    "any.required": "Phải chọn phạm vi (Scope) cho quiz",
    "any.only": "Scope phải là 'course' hoặc 'lesson'",
  }),

  course: Joi.string().required().messages({
    "any.required": "Quiz phải thuộc về một khóa học",
  }),

  lesson: Joi.string().optional().allow(null, ""), // quiz có thể thuộc lesson hoặc không

  type: Joi.string().valid("quiz", "exam", "practice").default("quiz"),

  timeLimit: Joi.number().min(1).allow(null).messages({
    "number.min": "Thời gian tối thiểu là 1 phút",
  }),

  passingScore: Joi.number().min(0).default(0).messages({
    "number.min": "Điểm qua môn không hợp lệ",
  }),
  slug: Joi.string().optional(),

  questions: Joi.array().items(Joi.string()).default([]),

  shuffleQuestions: Joi.boolean().default(false),
  shuffleOptions: Joi.boolean().default(false),

  maxAttempts: Joi.number().min(1).default(1),

  isPublished: Joi.boolean().default(false),

  createdBy: Joi.string().required().messages({
    "any.required": "Thiếu thông tin người tạo quiz",
  }),

  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
});

export const updateQuizSchema = Joi.object({
  _id: Joi.string().optional(),
  __v: Joi.number().optional(),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
  slug: Joi.string().optional(),
  createdBy: Joi.string().optional(),

  title: Joi.string().trim().min(1).optional().messages({
    "string.empty": "Tiêu đề không được để trống",
  }),

  scope: Joi.string().valid("course", "lesson").optional(),

  course: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "CourseId không hợp lệ",
    }),

  lesson: Joi.alternatives()
    .try(
      Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
      Joi.valid(null),
      Joi.valid("")
    )
    .optional()
    .messages({
      "string.pattern.base": "LessonId không hợp lệ",
    }),

  type: Joi.string().valid("quiz", "exam", "practice").optional(),

  timeLimit: Joi.number().min(1).allow(null).optional(),

  passingScore: Joi.number().min(0).optional(),

  questions: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .optional()
    .messages({
      "string.pattern.base": "QuestionId không hợp lệ",
    }),

  shuffleQuestions: Joi.boolean().optional(),
  shuffleOptions: Joi.boolean().optional(),

  maxAttempts: Joi.number().min(1).optional(),

  isPublished: Joi.boolean().optional(),
})
  // 🔥 validate logic scope ↔ lesson
  .custom((value, helpers) => {
    if (value.scope === "lesson" && !value.lesson) {
      return helpers.error("any.invalid", {
        message: "Scope lesson bắt buộc có lessonId",
      });
    }

    if (value.scope === "course" && value.lesson) {
      return helpers.error("any.invalid", {
        message: "Scope course không được có lessonId",
      });
    }

    return value;
  })
  .unknown(false);
export const quizBulkItemSchema = Joi.object({
  title: Joi.string().trim().min(1).required(),

  scope: Joi.string().valid("course", "lesson").required(),

  type: Joi.string().valid("quiz", "exam", "practice").default("quiz"),

  courseSlug: Joi.string().trim().required(),

  lessonSlug: Joi.string().trim().allow(null, "").optional(),

  timeLimit: Joi.number().min(1).allow(null),

  passingScore: Joi.number().min(0).default(0),

  maxAttempts: Joi.number().min(1).default(1),

  shuffleQuestions: Joi.boolean().default(false),
  shuffleOptions: Joi.boolean().default(false),

  isPublished: Joi.boolean().default(false),
});
export const quizBulkSchema = Joi.array()
  .items(quizBulkItemSchema)
  .min(1)
  .messages({
    "array.base": "Payload phải là mảng quiz",
    "array.min": "Danh sách quiz rỗng",
  });
