import Joi from "joi";

export const registerSchema = Joi.object({
  fullname: Joi.string().min(2).max(100).required(),
  contact: Joi.string().required(),
  password: Joi.string().min(6).max(50).required(),
  method: Joi.string().valid("email", "phone").required(),
});

export const validateRegister = (req, res, next) => {
  const { error } = registerSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map((detail) => ({
      message: detail.message,
      field: detail.context.key,
    }));
    return res.status(400).json({ success: false, errors });
  }

  next();
};
