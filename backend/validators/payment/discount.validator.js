import Joi from "joi";

export const createDiscountSchema = Joi.object({
  code: Joi.string().uppercase().trim().required(),

  type: Joi.string().valid("percentage", "fixed").required(),

  value: Joi.when("type", {
    is: "percentage",
    then: Joi.number().min(1).max(100).required(),
    otherwise: Joi.number().min(0).required(),
  }),

  minOrderValue: Joi.number().min(0).default(0),

  maxDiscountAmount: Joi.number().min(0).default(0),

  applicableTo: Joi.string()
    .valid("all", "course", "bundle", "user_specific")
    .default("all"),

  allowedUsers: Joi.when("applicableTo", {
    is: "user_specific",
    then: Joi.array().items(Joi.string().hex().length(24)).min(1).required(),
    otherwise: Joi.array().items(Joi.string().hex().length(24)).default([]),
  }),

  startDate: Joi.date().default(Date.now),

  endDate: Joi.date().greater(Joi.ref("startDate")).required(),

  usageLimit: Joi.number().min(0).default(0),

  isActive: Joi.boolean().default(true),
}).options({ stripUnknown: true });
export const updateDiscountSchema = Joi.object({
  code: Joi.string().uppercase().trim().optional(),

  type: Joi.string().valid("percentage", "fixed").optional(),

  value: Joi.number().min(0).optional(),

  minOrderValue: Joi.number().min(0).optional(),

  maxDiscountAmount: Joi.number().min(0).optional(),

  applicableTo: Joi.string()
    .valid("all", "course", "bundle", "user_specific")
    .optional(),

  allowedUsers: Joi.array().items(Joi.string().hex().length(24)).optional(),

  startDate: Joi.date().optional(),

  endDate: Joi.date().optional(),

  usageLimit: Joi.number().min(0).optional(),

  isActive: Joi.boolean().optional(),
})
.options({ stripUnknown: true });
export const discountBulkItemSchema = Joi.object({
  code: Joi.string().trim().required(),

  type: Joi.string().valid("percentage", "fixed").required(),

  value: Joi.number().min(0).required(),

  minOrderValue: Joi.number().min(0).optional(),
  maxDiscountAmount: Joi.number().min(0).optional(),

  applicableTo: Joi.string()
    .valid("all", "course", "bundle", "user_specific")
    .optional(),

  allowedUserNames: Joi.array().items(Joi.string().trim()).optional(),

  startDate: Joi.date().optional(),
  endDate: Joi.date().required(),

  usageLimit: Joi.number().min(0).optional(),
  isActive: Joi.boolean().optional(),
}).options({ stripUnknown: true });

export const discountBulkSchema = Joi.array()
  .items(discountBulkItemSchema)
  .min(1)
  .messages({
    "array.base": "Payload phải là mảng discount",
    "array.min": "Danh sách discount rỗng",
  });
