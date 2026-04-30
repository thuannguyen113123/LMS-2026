import Joi from "joi";

export const createNotificationSchema = Joi.object({
  userId: Joi.string().required(),
  roomId: Joi.string().required(),
});

export const getNotificationSchema = Joi.object({
  userId: Joi.string().required(),
  roomId: Joi.string().required(),
});

export const updateLastReadMessageSchema = Joi.object({
  userId: Joi.string().required(),
  roomId: Joi.string().required(),
  lastReadMessageId: Joi.string().required(),
});

export const incrementUnreadCountSchema = Joi.object({
  userId: Joi.string().required(),
  roomId: Joi.string().required(),
});

export const muteNotificationsSchema = Joi.object({
  userId: Joi.string().required(),
  roomId: Joi.string().required(),
  muted: Joi.boolean().required(),
});

export const deleteNotificationSchema = Joi.object({
  userId: Joi.string().required(),
  roomId: Joi.string().required(),
});

export const listByUserSchema = Joi.object({
  userId: Joi.string().required(),
});
