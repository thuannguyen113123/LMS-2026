import Joi from "joi";

export const questionSchema = Joi.object({
  quiz: Joi.string().required().messages({
    "any.required": "Câu hỏi phải thuộc một quiz cụ thể",
  }),

  type: Joi.string()
    .valid("multiple_choice", "true_false", "short_answer", "coding")
    .required()
    .messages({
      "any.required": "Loại câu hỏi là bắt buộc",
      "any.only": "Loại câu hỏi không hợp lệ",
    }),

  content: Joi.string().required().messages({
    "string.empty": "Nội dung câu hỏi không được để trống",
    "any.required": "Thiếu nội dung câu hỏi",
  }),

  // ✅ Chỉ bắt buộc nếu là Multiple Choice
  options: Joi.when("type", {
    is: "multiple_choice",
    then: Joi.array()
      .items(
        Joi.object({
          _id: Joi.string().optional(),
          text: Joi.string().required(),
          isCorrect: Joi.boolean().default(false),
          feedback: Joi.string().allow(""),
        })
      )
      .min(2)
      .required()
      .messages({
        "array.min": "Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn",
      }),
    otherwise: Joi.any().allow(null).optional(), // chỉ cho phép null, bỏ []
  }),

  correctAnswers: Joi.when("type", {
    is: "multiple_choice",
    then: Joi.array().items(Joi.string()).min(1).required().messages({
      "array.min": "Phải có ít nhất một đáp án đúng",
      "any.required": "Cần có đáp án đúng",
    }),
    otherwise: Joi.forbidden().optional(), // short_answer và coding sẽ không validate correctAnswers
  }),

  explanation: Joi.string().allow("").optional(),

  difficulty: Joi.string().valid("easy", "medium", "hard").default("medium"),

  tags: Joi.array().items(Joi.string()).default([]),

  points: Joi.number().min(1).default(1),
});
export const questionUpdateSchema = Joi.object({
  quiz: Joi.alternatives().try(
    Joi.string(),
    Joi.object({
      id: Joi.string().required(),
      title: Joi.string().optional(),
      slug: Joi.string().optional(),
    })
  ),

  type: Joi.string().valid(
    "multiple_choice",
    "true_false",
    "short_answer",
    "coding"
  ),

  content: Joi.string(),

  options: Joi.array().items(
    Joi.object({
      _id: Joi.string().optional(),
      text: Joi.string().required(),
      isCorrect: Joi.boolean(),
      feedback: Joi.string().allow(""),
    })
  ),

  correctAnswers: Joi.array().items(Joi.string()),

  explanation: Joi.string().allow(""),

  difficulty: Joi.string().valid("easy", "medium", "hard"),

  tags: Joi.array().items(Joi.string()),

  points: Joi.number().min(1),
}).options({ stripUnknown: true });

export const questionBulkItemSchema = Joi.object({
  quizTitle: Joi.string().trim().required(),

  type: Joi.string()
    .valid("multiple_choice", "true_false", "short_answer", "coding")
    .required(),

  content: Joi.string().trim().required(),

  options: Joi.array()
    .items(
      Joi.object({
        text: Joi.string().required(),
        isCorrect: Joi.boolean().optional(),
        feedback: Joi.string().allow("").optional(),
      })
    )
    .optional(),

  correctAnswers: Joi.array().items(Joi.string()).optional(),

  explanation: Joi.string().allow("").optional(),

  difficulty: Joi.string().valid("easy", "medium", "hard").optional(),

  tags: Joi.array().items(Joi.string()).optional(),

  points: Joi.number().min(0).optional(),
}).options({ stripUnknown: true });

export const questionBulkSchema = Joi.array()
  .items(questionBulkItemSchema)
  .min(1)
  .messages({
    "array.base": "Payload phải là mảng question",
    "array.min": "Danh sách question rỗng",
  });
