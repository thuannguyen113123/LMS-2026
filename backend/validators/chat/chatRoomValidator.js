import Joi from "joi";

export const createRoomSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),

  type: Joi.string()
    .valid("course", "class", "teacher_student", "system")
    .required(),
}).unknown(false);
export const createPrivateRoomSchema = Joi.object({
  targetUserId: Joi.string().hex().length(24).required(),
}).unknown(false);
export const chatRoomSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),

  type: Joi.string()
    .valid("private", "course", "class", "teacher_student", "system")
    .required(),

  user_ids: Joi.array()
    .items(Joi.string().hex().length(24))
    .min(1)
    .when("type", {
      is: Joi.valid("class", "course", "teacher_student"),
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
}).unknown(false);
export const addMemberSchema = Joi.object({
  roomId: Joi.string().hex().length(24).required(),
  userId: Joi.string().hex().length(24).required(),
}).unknown(false);
export const removeMemberSchema = Joi.object({
  roomId: Joi.string().hex().length(24).required(),
  userId: Joi.string().hex().length(24).required(),
}).unknown(false);
export const setAdminsSchema = Joi.object({
  roomId: Joi.string().hex().length(24).required(),
  adminIds: Joi.array().items(Joi.string().hex().length(24)).required(),
}).unknown(false);
export const updateRoomSchema = Joi.object({
  name: Joi.string().trim().min(1).optional(),

  type: Joi.string()
    .valid("course", "class", "teacher_student", "system")
    .optional(),
})
  .or("name", "type")
  .unknown(false);
