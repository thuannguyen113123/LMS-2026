export default class AppError extends Error {
  constructor(code, message, statusCode = 400, meta = {}) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.meta = meta;
    Error.captureStackTrace(this, this.constructor);
  }
}
