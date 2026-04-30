import Joi from "joi";

export const attachmentSchema = Joi.object({
  type: Joi.string().valid("image", "file", "video", "audio").required(),
  url: Joi.string().uri().required(),
  filename: Joi.string().required(),
  size: Joi.number().required(),
  thumbnailUrl: Joi.string().uri().allow(null).optional(),
});

export const reactionSchema = Joi.object({
  userId: Joi.string().required(),
  reaction: Joi.string().required(),
});

export const messageSchema = Joi.object({
  roomId: Joi.string().allow(null, "").optional(),
  content: Joi.string().allow("").optional(),
  messageType: Joi.string().valid("text", "attachment", "system").required(),
  attachments: Joi.array().items(attachmentSchema).default([]),
  replyTo: Joi.string().allow(null).optional(),
  metadata: Joi.object({
    edited: Joi.boolean().default(false),
    deleted: Joi.boolean().default(false),
  }).optional(),
});

export const messageUpdateSchema = Joi.object({
  content: Joi.string().allow("").optional(),
  attachments: Joi.array().items(attachmentSchema).optional(),
  metadata: Joi.object({
    edited: Joi.boolean().default(true),
    deleted: Joi.boolean(),
  }).optional(),
});

export const messageReactionSchema = Joi.object({
  messageId: Joi.string().required(),
  reaction: Joi.string().required(),
});

export const messageUnreactSchema = Joi.object({
  messageId: Joi.string().required(),
});
