import Joi from "joi";

// Schema cơ bản cho tạo hoặc update attempt
export const AttemptSchema = Joi.object({
  student: Joi.string().required().messages({
    "any.required": "Student is required",
  }),
  quiz: Joi.string().required().messages({
    "any.required": "Quiz is required",
  }),

  status: Joi.string()
    .valid("in_progress", "submitted", "graded")
    .default("in_progress"),

  score: Joi.number().min(0).default(0),
  totalPoints: Joi.number().min(0).default(0),

  correctCount: Joi.number().min(0).default(0),
  wrongCount: Joi.number().min(0).default(0),
  skippedCount: Joi.number().min(0).default(0),

  startedAt: Joi.date().optional(),
  submittedAt: Joi.date().allow(null).optional(),
});

// // Schema khi submit attempt (update kết quả)
// export const submitAttemptSchema = Joi.object({
//   score: Joi.number().required(),
//   correctCount: Joi.number().required(),
//   wrongCount: Joi.number().required(),
//   skippedCount: Joi.number().required(),
//   status: Joi.string().valid("submitted", "graded").default("submitted"),
//   submittedAt: Joi.date().default(() => new Date(), "current date"),
// });
