import slugify from "slugify";
import Student from "../models/student/student.model.js";

export function generate6DigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function formatPhoneNumber(phone) {
  if (!phone) throw new Error("INVALID_PHONE");

  const phoneStr = String(phone).trim();

  const cleaned = phoneStr.replace(/\D/g, "");

  if (/^\d{9}$/.test(cleaned)) {
    return "+84" + cleaned;
  }

  if (/^0\d{9}$/.test(cleaned)) {
    return "+84" + cleaned.slice(1);
  }

  if (/^\+84\d{9}$/.test(phoneStr)) {
    return phoneStr;
  }

  throw new Error("INVALID_PHONE");
}

export const getUserIdentifier = (user) =>
  user?.email || user?.phone || user?._id?.toString() || "unknown";

export const mapDoc = (doc) => {
  if (!doc) return null;
  const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const { _id, __v, ...rest } = obj;
  return { id: _id?.toString(), ...rest };
};

export const AUTH_CODES = {
  USER_NOT_FOUND: "AUTH_USER_NOT_FOUND",
  OTP_INVALID: "AUTH_OTP_INVALID",
  OTP_EXPIRED: "AUTH_OTP_EXPIRED",
  USER_ALREADY_ACTIVE: "AUTH_USER_ALREADY_ACTIVE",
  OTP_VERIFIED: "AUTH_OTP_VERIFIED",
  SERVER_ERROR: "SERVER_ERROR",
  REGISTER_SUCCESS: "AUTH_REGISTER_SUCCESS",
  METHOD_INVALID: "AUTH_METHOD_INVALID",
  CONTACT_INVALID: "AUTH_CONTACT_INVALID",
  USER_EXISTS: "AUTH_USER_EXISTS",
  ROLE_NOT_FOUND: "AUTH_ROLE_NOT_FOUND",
  OTP_SENT: "AUTH_OTP_SENT",
  USER_NOT_ACTIVE: "AUTH_USER_NOT_ACTIVE",
  PASSWORD_INVALID: "AUTH_PASSWORD_INVALID",
  LOGIN_SUCCESS: "AUTH_LOGIN_SUCCESS",
  LOGOUT_SUCCESS: "AUTH_LOGOUT_SUCCESS",
  GOOGLE_LOGIN_SUCCESS: "AUTH_GOOGLE_LOGIN_SUCCESS",
  GOOGLE_TOKEN_INVALID: "AUTH_GOOGLE_TOKEN_INVALID",
  ACCOUNT_PROVIDER_CONFLICT: "AUTH_ACCOUNT_PROVIDER_CONFLICT",
  GITHUB_LOGIN_SUCCESS: "AUTH_GITHUB_LOGIN_SUCCESS",
  GITHUB_TOKEN_INVALID: "AUTH_GITHUB_TOKEN_INVALID",
  EMAIL_REQUIRED: "AUTH_EMAIL_REQUIRED",
  SET_PASSWORD_SUCCESS: "AUTH_SET_PASSWORD_SUCCESS",
  SET_PASSWORD_TOKEN_INVALID: "AUTH_SET_PASSWORD_TOKEN_INVALID",
  SET_PASSWORD_TOKEN_EXPIRED: "AUTH_SET_PASSWORD_TOKEN_EXPIRED",
  SET_PASSWORD_MISSING_DATA: "AUTH_SET_PASSWORD_MISSING_DATA",
  FORGOT_PASSWORD_EMAIL_REQUIRED: "AUTH_FORGOT_PASSWORD_EMAIL_REQUIRED",
  FORGOT_PASSWORD_USER_NOT_FOUND: "AUTH_FORGOT_PASSWORD_USER_NOT_FOUND",
  FORGOT_PASSWORD_SENT: "AUTH_FORGOT_PASSWORD_SENT",

  RESET_PASSWORD_SUCCESS: "AUTH_RESET_PASSWORD_SUCCESS",
  RESET_PASSWORD_TOKEN_INVALID: "AUTH_RESET_PASSWORD_TOKEN_INVALID",
  RESET_PASSWORD_TOKEN_EXPIRED: "AUTH_RESET_PASSWORD_TOKEN_EXPIRED",
  RESET_PASSWORD_PASSWORD_INVALID: "AUTH_RESET_PASSWORD_PASSWORD_INVALID",
  RESET_PASSWORD_OTP_VERIFIED: "AUTH_RESET_PASSWORD_OTP_VERIFIED",
  SET_PASSWORD_OTP_VERIFIED: "AUTH_SET_PASSWORD_OTP_VERIFIED",
};
export async function generateUniqueSlug(userId, fullname) {
  if (!fullname) throw new Error("Fullname is required to generate slug");

  const baseSlug = slugify(fullname, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  // Kiểm tra trùng
  while (await Student.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
