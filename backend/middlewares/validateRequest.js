export default (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: error.details[0].message,
    });
  }
  req.validatedBody = value;
  next();
};
