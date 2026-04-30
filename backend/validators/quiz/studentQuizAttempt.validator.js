import Joi from "joi";
import mongoose from "mongoose";

const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

export const startQuizAttemptSchema = Joi.object({
  quizId: Joi.string().required().custom(objectIdValidator).messages({
    "any.required": "Thiếu quizId",
    "any.invalid": "quizId không hợp lệ",
    "string.empty": "quizId không được để trống",
  }),

  lessonId: Joi.string().required().custom(objectIdValidator).messages({
    "any.required": "Thiếu lessonId",
    "any.invalid": "lessonId không hợp lệ",
    "string.empty": "lessonId không được để trống",
  }),
}).unknown(false);
