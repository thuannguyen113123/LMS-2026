// validations/lessonProgress.validation.js
import Joi from "joi";
import mongoose from "mongoose";

/* =====================================================
   COMMON
===================================================== */
const objectId = Joi.string()
  .custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error("any.invalid");
    }
    return value;
  })
  .messages({
    "any.invalid": "ID không hợp lệ",
    "any.required": "ID là bắt buộc",
  });

/* =====================================================
   GET OR CREATE (khi mở bài học)
===================================================== */
export const getOrCreateSchema = Joi.object({
  courseId: objectId.required().messages({
    "any.required": "Course ID là bắt buộc",
  }),

  lessonId: objectId.required().messages({
    "any.required": "Lesson ID là bắt buộc",
  }),

  lessonType: Joi.string()
    .valid("video", "quiz", "reading", "assignment")
    .required()
    .messages({
      "any.only": "lessonType không hợp lệ",
      "any.required": "lessonType là bắt buộc",
    }),
}).unknown(false);

/* =====================================================
   UPDATE WATCHING (VIDEO)
===================================================== */
export const updateWatchingSchema = Joi.object({
  lessonId: objectId.required().messages({
    "any.required": "Lesson ID là bắt buộc",
  }),

  currentTime: Joi.number().min(0).required().messages({
    "number.base": "currentTime phải là số",
    "number.min": "currentTime không được âm",
    "any.required": "currentTime là bắt buộc",
  }),

  duration: Joi.number().min(0).required().messages({
    "number.base": "duration phải là số",
    "number.min": "duration không được âm",
    "any.required": "duration là bắt buộc",
  }),
}).unknown(false);

/* =====================================================
   COMPLETE LESSON
===================================================== */
export const completeLessonSchema = Joi.object({
  lessonId: objectId.required().messages({
    "any.required": "Lesson ID là bắt buộc",
  }),
}).unknown(false);

/* =====================================================
   SUBMIT QUIZ
===================================================== */
export const submitQuizSchema = Joi.object({
  lesson: objectId.required().messages({
    "any.required": "Lesson ID là bắt buộc",
  }),

  score: Joi.number().min(0).required().messages({
    "number.base": "score phải là số",
    "number.min": "score không được âm",
    "any.required": "score là bắt buộc",
  }),

  passScore: Joi.number().min(0).optional().messages({
    "number.base": "passScore phải là số",
    "number.min": "passScore không được âm",
  }),
}).unknown(false);
