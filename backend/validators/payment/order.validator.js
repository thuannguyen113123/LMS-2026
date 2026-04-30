import Joi from "joi";

export const createOrderSchema = Joi.object({
  items: Joi.array()
    .min(1)
    .items(
      Joi.object({
        productId: Joi.string().hex().length(24).required(),
      }).unknown(false)
    )
    .required(),

  couponCode: Joi.string().trim().max(50).allow(null, ""),
}).unknown(false);
export const orderItemBulkSchema = Joi.object({
  userName: Joi.string().trim().required(),

  items: Joi.array()
    .items(
      Joi.object({
        itemType: Joi.string().valid("course", "bundle").optional(),

        productTitle: Joi.string().trim().required(),

        price: Joi.number().min(0).required(),
      })
    )
    .min(1)
    .required(),

  subtotal: Joi.number().required(),

  discountApplied: Joi.boolean().optional(),

  couponCode: Joi.string().allow(null, "").optional(),

  discountValue: Joi.number().min(0).optional(),

  totalAmount: Joi.number().required(),

  finalAmount: Joi.number().required(),
}).options({ stripUnknown: true });

export const orderBulkSchema = Joi.array()
  .items(orderItemBulkSchema)
  .min(1)
  .messages({
    "array.base": "Payload phải là mảng order",
    "array.min": "Danh sách order rỗng",
  });
