import Joi from "joi";
import mongoose from "mongoose";

const objectIdValidator = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId validation");

export const markAsReadSchema = Joi.object({
  messageId: objectIdValidator.required(),
  userId: objectIdValidator.required(),
});

export const bulkMarkAsReadSchema = Joi.array()
  .items(
    Joi.object({
      messageId: objectIdValidator.required(),
      userId: objectIdValidator.required(),
    })
  )
  .min(1)
  .required();

export const messageIdParamSchema = Joi.object({
  messageId: objectIdValidator.required(),
});

export const userIdParamSchema = Joi.object({
  userId: objectIdValidator.required(),
});

export const deleteReadSchema = Joi.object({
  messageId: objectIdValidator.required(),
  userId: objectIdValidator.required(),
});
