import UserVerification from "../../models/userVerification/userVerification.model.js";
import VerificationService from "../Verification/verification.service.js";
import UserVerificationService from "../../services/userVerification/userVerification.service.js";

import bcrypt from "bcrypt";
import crypto from "crypto";

import User from "../../models/user/user.model.js";
import Student from "../../models/student/student.model.js";

import RoleService from "../../services/role/role.services.js";
import mongoose from "mongoose";
import {
  AUTH_CODES,
  formatPhoneNumber,
  generate6DigitCode,
  generateUniqueSlug,
} from "./../../utils/helpers.js";
import AppError from "../../utils/AppError.js";
import { generateAccessToken } from "../../utils/jwt.js";
import { sendResetPasswordEmail } from "../notification/emailService.js";
import { sendOtpSms } from "../notification/smsService.js";
import { getPermissionsByRole } from "../RolePermission/RolePermissionServices.js";
import NotificationService, {
  TYPE_SETTING_MAP,
} from "../../services/notification/notification.service.js";

export const mapUser = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  return {
    id: doc._id.toString(),
    fullname: doc.fullname,
    email: doc.email,
    phone: doc.phone,
    avatar: doc.avatar,
    provider: doc.provider,

    roles:
      doc.role_ids?.map((r) => ({
        id: r._id?.toString?.() || r.toString(),
        name: r.name,
      })) || [],

    activeRole: doc.active_role_id
      ? {
          id:
            doc.active_role_id._id?.toString?.() ||
            doc.active_role_id.toString(),
          name: doc.active_role_id.name,
        }
      : null,

    isActive: doc.isActive,
    verified: doc.verified,
    locked: doc.locked,
    lastLogin: doc.lastLogin,
    isOnline: doc.isOnline,

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const authService = {
  encodeKey(str) {
    return str
      .replace(/\./g, "__dot__")
      .replace(/@/g, "__at__")
      .replace(/#/g, "__hash__")
      .replace(/\$/g, "__dollar__")
      .replace(/\[/g, "__obr__")
      .replace(/\]/g, "__cbr__");
  },

  async register({ fullname, contact, password, method }) {
    if (!["email", "phone"].includes(method)) {
      throw new AppError(
        AUTH_CODES.METHOD_INVALID,
        "Phương thức đăng ký không hợp lệ",
        400
      );
    }
    let email = null;
    let phone = null;

    if (method === "email") {
      email = contact.toLowerCase().trim();
    } else {
      try {
        phone = formatPhoneNumber(contact);
      } catch {
        throw new AppError(
          AUTH_CODES.CONTACT_INVALID,
          "Số điện thoại không hợp lệ",
          400
        );
      }
    }

    const existedUser = email
      ? await this.getUserByEmail(email)
      : await this.getUserByPhone(phone);

    if (existedUser) {
      throw new AppError(AUTH_CODES.USER_EXISTS, "Tài khoản đã tồn tại", 409);
    }

    const role = await RoleService.getRoleByName("student");

    if (!role) {
      throw new AppError(
        AUTH_CODES.ROLE_NOT_FOUND,
        "Role mặc định không tồn tại",
        500
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.createUser({
      fullname,
      email,
      phone,
      password: hashedPassword,
      provider: "local",
      role_ids: [role._id],
      active_role_id: role._id,
      verified: false,
      isActive: false,
    });

    await VerificationService.createOtp(user._id, {
      email,
      phone,
    });

    return {
      nextStep: "verify-otp",
      method,
    };
  },
  async verifyOtp({ phone, email, accessCode }) {
    const contact = phone
      ? formatPhoneNumber(phone)
      : email?.toLowerCase()?.trim();

    // ===== 1. Find user =====
    const userRaw = phone
      ? await this.getUserByPhone(contact)
      : await this.getUserByEmail(contact);

    if (!userRaw) {
      throw new AppError(
        AUTH_CODES.USER_NOT_FOUND,
        "Người dùng không tồn tại",
        404
      );
    }

    if (userRaw.isActive) {
      throw new AppError(
        AUTH_CODES.USER_ALREADY_ACTIVE,
        "Tài khoản đã kích hoạt",
        400
      );
    }

    // ===== 2. Verify OTP =====
    const tokenData = await UserVerificationService.getVerificationToken(
      accessCode,
      "otp"
    );

    if (
      !tokenData ||
      !tokenData.userId ||
      !tokenData.userId.equals(userRaw._id) ||
      tokenData.expiry < Date.now()
    ) {
      throw new AppError(
        AUTH_CODES.OTP_INVALID,
        "Mã OTP không đúng hoặc đã hết hạn",
        400
      );
    }

    // ===== 3. Activate user =====
    const updatedUser = await User.findByIdAndUpdate(
      userRaw._id,
      {
        isActive: true,
        verified: true,
      },
      { new: true }
    )
      .populate("role_ids")
      .populate("active_role_id");

    try {
      const adminRole = await RoleService.getRoleByName("admin");

      const admins = await User.find({
        role_ids: adminRole._id,
      }).lean();

      const adminIds = admins.map((u) => u._id);
      await Promise.all(
        adminIds.map((adminId) =>
          NotificationService.send({
            userId: adminId,
            type: TYPE_SETTING_MAP.USER_REGISTERED,
            title: "Người dùng mới xác thực",
            message: `User ${
              updatedUser.fullname || updatedUser.email || updatedUser.phone
            } đã xác thực tài khoản`,
            entityId: updatedUser.id,
            entityType: "User",
          })
        )
      );
    } catch (err) {
      console.error("Send admin notification failed:", err);
    }

    let student = await Student.findOne({ user: updatedUser._id });

    if (!student) {
      const slug = await generateUniqueSlug(
        updatedUser._id,
        updatedUser.fullname
      );

      await Student.create({
        user: updatedUser._id,
        slug,
      });
    }

    // ===== 5. Delete OTP =====
    await UserVerificationService.deleteVerificationToken(accessCode);

    // ===== 6. Generate token =====
    const roleName = updatedUser.active_role_id?.name || "student";
    const permissions = await getPermissionsByRole(roleName);

    const token = generateAccessToken({
      id: updatedUser._id,
      role: roleName,
      roleId: updatedUser.active_role_id?._id,
      email: updatedUser.email,
      fullname: updatedUser.fullname,
      phone: updatedUser.phone,
      permissions,
    });

    return {
      token,
      user: mapUser(updatedUser),
      permissions,
    };
  },

  async resendOtp({ phone, email, purpose }) {
    const contact = phone
      ? formatPhoneNumber(phone)
      : email?.toLowerCase()?.trim();

    const isAuthVerify = purpose === "register";
    const isResetPassword = purpose === "reset-password";

    // ===== 1. find user =====
    const userRaw = phone
      ? await this.getUserByPhone(contact)
      : await this.getUserByEmail(contact);

    if (!userRaw) {
      throw new AppError(
        AUTH_CODES.USER_NOT_FOUND,
        "Người dùng không tồn tại",
        404
      );
    }

    if (isAuthVerify && userRaw.isActive) {
      throw new AppError(
        AUTH_CODES.USER_ALREADY_ACTIVE,
        "Tài khoản đã được kích hoạt",
        400
      );
    }

    // ===== 2. delete old OTP =====
    await UserVerificationService.deleteOtpTokensByUser(userRaw._id);

    // ===== 3. create new OTP (delegate) =====
    await VerificationService.createOtp(userRaw._id, {
      email: userRaw.email,
      phone: userRaw.phone,
    });

    return {
      method: userRaw.email ? "email" : "phone",
    };
  },
  async login({ contact, password, method }) {
    // ===== 1. Validate method =====
    if (!["email", "phone"].includes(method)) {
      throw new AppError(
        AUTH_CODES.METHOD_INVALID,
        "Phương thức đăng nhập không hợp lệ",
        400
      );
    }

    // ===== 2. Normalize contact =====
    const formattedContact =
      method === "phone"
        ? formatPhoneNumber(contact)
        : contact.toLowerCase().trim();

    // ===== 3. Find user + populate role =====
    const userRaw =
      method === "phone"
        ? await User.findOne({ phone: formattedContact })
            .populate("role_ids")
            .populate("active_role_id")
        : await User.findOne({ email: formattedContact })
            .populate("role_ids")
            .populate("active_role_id");

    if (!userRaw) {
      throw new AppError(
        AUTH_CODES.USER_NOT_FOUND,
        "Người dùng không tồn tại",
        404
      );
    }

    // ===== 4. Check active =====
    if (!userRaw.isActive) {
      throw new AppError(
        AUTH_CODES.USER_NOT_ACTIVE,
        "Tài khoản chưa xác thực OTP",
        403
      );
    }

    // ===== 5. Compare password =====
    const match = await bcrypt.compare(password, userRaw.password);

    if (!match) {
      throw new AppError(AUTH_CODES.PASSWORD_INVALID, "Sai mật khẩu", 401);
    }

    // ===== 6. Update last login & online status (return updated user) =====
    const updatedUser = await User.findByIdAndUpdate(
      userRaw._id,
      {
        lastLogin: new Date(),
        isOnline: true,
      },
      { new: true }
    )
      .populate("role_ids")
      .populate("active_role_id");

    const roleName = updatedUser.active_role_id?.name || "student";

    const permissions = await getPermissionsByRole(roleName);

    // ===== 7. Generate token =====
    const token = generateAccessToken({
      id: updatedUser._id,
      role: roleName,
      roleId: updatedUser.active_role_id?._id,
      fullname: updatedUser.fullname,
      permissions,
    });

    return {
      token,
      user: mapUser(updatedUser),
      permissions,
    };
  },

  async loginGoogle(firebaseUser) {
    const { email, name, picture, sub, email_verified } = firebaseUser;

    // ===== 1. Validate =====
    if (!email) {
      throw new AppError(
        AUTH_CODES.GOOGLE_TOKEN_INVALID,
        "Google không trả về email",
        400
      );
    }

    if (email_verified === false) {
      throw new AppError(
        AUTH_CODES.GOOGLE_TOKEN_INVALID,
        "Email Google chưa được xác thực",
        400
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ===== 2. Get default student role =====
    const studentRole = await RoleService.getRoleByName("student");

    if (!studentRole) {
      throw new AppError(AUTH_CODES.ROLE_NOT_FOUND, "Role không tồn tại", 500);
    }

    // ===== 3. Find existing user =====
    let userRaw = await User.findOne({ email: normalizedEmail });
    let isNew = false;

    // ===== 4. Create or Update =====
    if (!userRaw) {
      isNew = true;

      userRaw = await User.create({
        fullname: name || "",
        email: normalizedEmail,
        avatar: picture || "",
        password: null,
        role_ids: [studentRole._id],
        active_role_id: studentRole._id,
        provider: "google",
        googleId: sub,
        isActive: true,
        verified: true,
        locked: false,
        lastLogin: new Date(),
        isOnline: true,
      });
    } else {
      await User.findByIdAndUpdate(userRaw._id, {
        isActive: true,
        verified: true,
        googleId: userRaw.googleId || sub,
        provider: userRaw.provider === "local" ? "google" : userRaw.provider,
        lastLogin: new Date(),
        isOnline: true,
      });
    }

    // ===== 5. Reload + populate role =====
    const updatedUser = await User.findOne({
      email: normalizedEmail,
    })
      .populate("role_ids")
      .populate("active_role_id");

    if (!updatedUser) {
      throw new AppError(
        AUTH_CODES.USER_NOT_FOUND,
        "Không tìm thấy người dùng sau khi xử lý",
        500
      );
    }

    // ===== 6. Ensure Student profile =====
    let student = await Student.findOne({
      user: updatedUser._id,
    });

    if (!student) {
      const slug = await generateUniqueSlug(
        updatedUser._id,
        updatedUser.fullname
      );

      await Student.create({
        user: updatedUser._id,
        slug,
      });
    }

    // ===== 7. Generate token =====
    const roleName = updatedUser.active_role_id?.name || "student";
    const permissions = await getPermissionsByRole(roleName);

    const token = generateAccessToken({
      id: updatedUser._id,
      role: roleName,
      roleId: updatedUser.active_role_id?._id,
      email: updatedUser.email,
      fullname: updatedUser.fullname,
      permissions,
    });

    return {
      token,
      user: mapUser(updatedUser),
      permissions,
      isNew,
    };
  },
  async loginGithub(firebaseUser) {
    const { email, name, picture, sub } = firebaseUser;

    // ===== 1. Validate =====
    if (!email) {
      throw new AppError(
        AUTH_CODES.GITHUB_EMAIL_NOT_FOUND,
        "GitHub account không public email",
        400
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ===== 2. Role =====
    const studentRole = await RoleService.getRoleByName("student");

    if (!studentRole) {
      throw new AppError(AUTH_CODES.ROLE_NOT_FOUND, "Role không tồn tại", 500);
    }

    // ===== 3. Find user =====
    let userRaw = await User.findOne({
      email: normalizedEmail,
    });

    let isNew = false;

    // ===== 4. Create / Update =====
    if (!userRaw) {
      isNew = true;

      userRaw = await User.create({
        fullname: name || "",
        email: normalizedEmail,
        avatar: picture || "",
        password: null,
        role_ids: [studentRole._id],
        active_role_id: studentRole._id,
        provider: "github",
        githubId: sub,
        isActive: true,
        verified: true,
        locked: false,
        lastLogin: new Date(),
        isOnline: true,
      });
    } else {
      await User.findByIdAndUpdate(userRaw._id, {
        isActive: true,
        verified: true,
        githubId: userRaw.githubId || sub,
        provider: userRaw.provider === "local" ? "github" : userRaw.provider,
        lastLogin: new Date(),
        isOnline: true,
      });
    }

    // ===== 5. Reload populated =====
    const updatedUser = await User.findOne({
      email: normalizedEmail,
    })
      .populate("role_ids")
      .populate("active_role_id");

    if (!updatedUser) {
      throw new AppError(
        AUTH_CODES.USER_NOT_FOUND,
        "Không tìm thấy user sau xử lý",
        500
      );
    }

    // ===== 6. Ensure student profile =====
    let student = await Student.findOne({
      user: updatedUser._id,
    });

    if (!student) {
      const slug = await generateUniqueSlug(
        updatedUser._id,
        updatedUser.fullname
      );

      await Student.create({
        user: updatedUser._id,
        slug,
      });
    }

    // ===== 7. Token =====
    const roleName = updatedUser.active_role_id?.name || "student";

    const permissions = await getPermissionsByRole(roleName);

    const token = generateAccessToken({
      id: updatedUser._id,
      role: roleName,
      roleId: updatedUser.active_role_id?._id,
      email: updatedUser.email,
      fullname: updatedUser.fullname,
      permissions,
    });

    return {
      token,
      user: mapUser(updatedUser),
      permissions,
      isNew,
    };
  },
  async setPassword({ token, password }) {
    // ===== 1. validate =====
    if (!token || !password) {
      throw new AppError(
        AUTH_CODES.SET_PASSWORD_MISSING_DATA,
        "Thiếu token hoặc mật khẩu",
        400
      );
    }

    // ===== 2. get verification token =====
    const tokenData = await UserVerificationService.getVerificationToken(
      token,
      "set-password"
    );

    if (!tokenData) {
      throw new AppError(
        AUTH_CODES.SET_PASSWORD_TOKEN_INVALID,
        "Token không hợp lệ",
        401
      );
    }

    if (tokenData.expiry < Date.now()) {
      throw new AppError(
        AUTH_CODES.SET_PASSWORD_TOKEN_EXPIRED,
        "Token đã hết hạn",
        401
      );
    }

    // ===== 3. get user =====
    const userRaw = await User.findById(tokenData.userId)
      .populate("role_ids")
      .populate("active_role_id");

    if (!userRaw) {
      throw new AppError(
        AUTH_CODES.USER_NOT_FOUND,
        "Người dùng không tồn tại",
        404
      );
    }

    // ===== 4. hash password =====
    const hashedPassword = await bcrypt.hash(password, 10);

    // ===== 5. update user =====
    const updatedUser = await User.findByIdAndUpdate(
      userRaw._id,
      {
        password: hashedPassword,
        isActive: true,
        verified: true,
      },
      { new: true }
    )
      .populate("role_ids")
      .populate("active_role_id");

    // ===== 6. ensure student profile =====
    const roleName = updatedUser.active_role_id?.name || "student";

    if (roleName === "student") {
      const existedStudent = await Student.findOne({
        user: updatedUser._id,
      });

      if (!existedStudent) {
        const slug = await generateUniqueSlug(
          updatedUser._id,
          updatedUser.fullname
        );

        await Student.create({
          user: updatedUser._id,
          slug,
          status: "active",
          createdBy: updatedUser._id,
          updatedBy: updatedUser._id,
        });
      }
    }

    // ===== 7. cleanup token =====
    await UserVerificationService.deleteVerificationToken(token);

    const permissions = await getPermissionsByRole(roleName);

    // ===== 8. generate jwt =====
    const accessToken = generateAccessToken({
      id: updatedUser._id,
      role: roleName,
      roleId: updatedUser.active_role_id?._id,
      email: updatedUser.email,
      phone: updatedUser.phone,
      fullname: updatedUser.fullname,
      permissions,
    });

    return {
      token: accessToken,
      user: mapUser(updatedUser),
      permissions,
    };
  },
  async forgotPassword({ email, phone }) {
    // ===== 1. validate =====
    if (!email && !phone) {
      throw new AppError(
        AUTH_CODES.CONTACT_INVALID,
        "Thông tin liên hệ không hợp lệ",
        400
      );
    }

    let user = null;

    // ===== 2. find user =====
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      user = await this.getUserByEmail(normalizedEmail);
    }

    if (!user && phone) {
      const formattedPhone = formatPhoneNumber(phone);
      user = await this.getUserByPhone(formattedPhone);
    }

    if (!user || !user.password) {
      return { sent: true };
    }

    // ===== 3. delete old tokens =====
    await UserVerificationService.deleteResetTokensByUser(user._id);

    // ===== 4. email reset =====
    if (email && user.email) {
      const token = crypto.randomBytes(32).toString("hex");

      await UserVerificationService.saveVerificationToken({
        userId: user._id,
        type: "reset-password",
        token,
        expiry: Date.now() + 15 * 60 * 1000,
      });

      await sendResetPasswordEmail(user.email, token);
    }

    // ===== 5. phone OTP reset =====
    if (phone && user.phone) {
      const otp = generate6DigitCode();

      await UserVerificationService.saveVerificationToken({
        userId: user._id,
        type: "reset-password-otp",
        token: otp,
        expiry: Date.now() + 5 * 60 * 1000,
      });

      await sendOtpSms(user.phone, otp);
    }

    return { sent: true };
  },
  async resetPassword({ token, password }) {
    // ===== 1. validate =====
    if (!token || !password) {
      throw new AppError(
        AUTH_CODES.SET_PASSWORD_MISSING_DATA,
        "Thiếu token hoặc mật khẩu",
        400
      );
    }

    if (password.length < 6) {
      throw new AppError(
        AUTH_CODES.RESET_PASSWORD_PASSWORD_INVALID,
        "Mật khẩu tối thiểu 6 ký tự",
        400
      );
    }

    // ===== 2. get reset token =====
    const record = await UserVerificationService.getVerificationToken(
      token,
      "reset-password"
    );

    if (!record) {
      throw new AppError(
        AUTH_CODES.RESET_PASSWORD_TOKEN_INVALID,
        "Token không hợp lệ",
        400
      );
    }

    // ===== 3. check expiry =====
    if (record.expiry < Date.now()) {
      throw new AppError(
        AUTH_CODES.RESET_PASSWORD_TOKEN_EXPIRED,
        "Token đã hết hạn",
        400
      );
    }

    // ===== 4. hash password =====
    const hashedPassword = await bcrypt.hash(password, 10);

    // ===== 5. update password =====
    const updatedUser = await this.updatePassword(
      record.userId,
      hashedPassword
    );

    if (!updatedUser) {
      throw new AppError(
        AUTH_CODES.USER_NOT_FOUND,
        "Người dùng không tồn tại",
        404
      );
    }

    // ===== 6. cleanup ALL reset tokens =====
    await UserVerificationService.deleteResetTokensByUser(record.userId);

    return {
      success: true,
    };
  },
  async verifyResetOtp({ phone, otp }) {
    if (!phone || !otp) {
      throw new AppError(
        AUTH_CODES.CONTACT_INVALID,
        "Thiếu thông tin xác thực",
        400
      );
    }

    const formattedPhone = formatPhoneNumber(phone);

    const user = await this.getUserByPhone(formattedPhone);

    if (!user) {
      throw new AppError(
        AUTH_CODES.USER_NOT_FOUND,
        "Người dùng không tồn tại",
        404
      );
    }

    const record = await UserVerificationService.getVerificationToken(
      otp,
      "reset-password-otp"
    );

    if (!record || !record.userId || !record.userId.equals(user._id)) {
      throw new AppError(AUTH_CODES.OTP_INVALID, "OTP không hợp lệ", 400);
    }

    if (record.expiry < Date.now()) {
      throw new AppError(AUTH_CODES.OTP_EXPIRED, "OTP đã hết hạn", 400);
    }

    await UserVerificationService.deleteVerificationToken(otp);
    await UserVerificationService.deleteResetTokensByUser(user._id);

    const resetToken = crypto.randomBytes(32).toString("hex");

    await UserVerificationService.saveVerificationToken({
      userId: user._id,
      type: "reset-password",
      token: resetToken,
      expiry: Date.now() + 15 * 60 * 1000,
    });

    return {
      resetToken,
    };
  },
  async verifySetPasswordOtp({ phone, otp }) {
    // ===== 1. validate =====
    if (!phone || !otp) {
      throw new AppError(
        AUTH_CODES.CONTACT_INVALID,
        "Thiếu thông tin xác thực",
        400
      );
    }

    // ===== 2. normalize phone =====
    const formattedPhone = formatPhoneNumber(phone);

    // ===== 3. find user =====
    const user = await this.getUserByPhone(formattedPhone);

    if (!user) {
      throw new AppError(
        AUTH_CODES.USER_NOT_FOUND,
        "Người dùng không tồn tại",
        404
      );
    }

    // ===== 4. get OTP =====
    const record = await UserVerificationService.getVerificationToken(
      otp,
      "set-password-otp"
    );

    if (!record || !record.userId || !record.userId.equals(user._id)) {
      throw new AppError(AUTH_CODES.OTP_INVALID, "OTP không hợp lệ", 400);
    }

    // ===== 5. expiry check =====
    if (record.expiry < Date.now()) {
      throw new AppError(AUTH_CODES.OTP_EXPIRED, "OTP đã hết hạn", 400);
    }

    // ===== 6. cleanup OTP =====
    await UserVerificationService.deleteVerificationToken(otp);

    // 🔥 IMPORTANT: tránh tồn tại nhiều token set-password
    await UserVerificationService.deleteVerificationTokensByUserAndType(
      user._id,
      "set-password"
    );

    // ===== 7. create set-password token =====
    const token = crypto.randomBytes(32).toString("hex");

    await UserVerificationService.saveVerificationToken({
      userId: user._id,
      type: "set-password",
      token,
      expiry: Date.now() + 15 * 60 * 1000,
    });

    return {
      token,
    };
  },

  async setAccessCode(contact, code) {
    // Tìm userId theo contact nếu có
    const user = await User.findOne({
      $or: [{ email: contact }, { phone: contact }],
    });

    const userId = user ? user._id : null;

    const expiryTimestamp = Date.now() + 5 * 60 * 1000; // 5 phút TTL

    // Lưu hoặc cập nhật trong UserVerification với type = "access_code"
    await UserVerification.findOneAndUpdate(
      { contact, type: "access_code" },
      {
        token: code,
        userId,
        contact,
        type: "access_code",
        expiry: expiryTimestamp,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );
  },

  async getAccessCode(contact) {
    const record = await UserVerification.findOne({
      contact,
      type: "access_code",
    });
    if (!record) return null;

    // Có thể check expiry ở đây nếu muốn, hoặc rely vào TTL
    if (record.expiry < Date.now()) {
      // Nếu expired thì xóa record luôn
      await UserVerification.deleteOne({ _id: record._id });
      return null;
    }
    return record.token;
  },

  async clearAccessCode(contact) {
    await UserVerification.deleteMany({ contact, type: "access_code" });
  },

  // Phần user thì giữ nguyên
  async createUser(user) {
    let roleIds = user.role_ids;
    let activeRoleId = user.active_role_id;

    // fallback
    if ((!roleIds || roleIds.length === 0) && user.role) {
      const role = await RoleService.getRoleByName(user.role);
      if (role) {
        roleIds = [role._id];
        activeRoleId = role._id;
      }
    }

    // default
    if (!roleIds || roleIds.length === 0) {
      const defaultRoleId = await RoleService.getDefaultRoleId("student");
      roleIds = [defaultRoleId];
      activeRoleId = defaultRoleId;
    }

    const newUserData = {
      fullname: user.fullname,
      password: user.password,

      role_ids: roleIds,
      active_role_id: activeRoleId,

      isActive: user.isActive ?? false,
      verified: user.verified ?? false,
      locked: user.locked ?? false,
      lastLogin: user.lastLogin ?? null,

      provider: user.provider,
      googleId: user.googleId ?? null,
      githubId: user.githubId ?? null,
    };

    // email/phone optional
    if (user.email) newUserData.email = user.email;
    if (user.phone) newUserData.phone = user.phone;

    const newUser = await User.create(newUserData);

    return newUser.toObject();
  },

  async updateUser(id, data) {
    const updated = await User.findByIdAndUpdate(id, data, {
      new: true,
    }).lean();
    return updated;
  },

  async findByContact(contact) {
    return await User.findOne({
      $or: [{ email: contact }, { phone: contact }],
    }).lean();
  },

  async getUserById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await User.findById(id).lean();
  },

  async getUserByEmail(email) {
    return await User.findOne({ email })
      .populate("role_ids")
      .populate("active_role_id"); // bỏ .lean()
  },
  async getUserByPhone(phone) {
    return await User.findOne({ phone })
      .populate("role_ids")
      .populate("active_role_id"); // bỏ .lean()
  },
  // Cập nhật mật khẩu user
  async updatePassword(userId, hashedPassword) {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        password: hashedPassword,
        // optional: reset trạng thái
        locked: false,
        isActive: true,
      },
      { new: true }
    ).lean();

    return updatedUser;
  },
  async me(userId) {
    const user = await User.findById(userId)
      .populate("role_ids")
      .populate("active_role_id")
      .lean();

    if (!user) {
      throw new AppError(AUTH_CODES.USER_NOT_FOUND, "User not found", 404);
    }

    const roleName = user.active_role_id?.name;

    const permissions = await getPermissionsByRole(roleName);

    return {
      user: mapUser(user),
      permissions,
    };
  },
  async switchRole({ userId, roleId }) {
    const user = await User.findById(userId).populate("role_ids");

    const role = user.role_ids.find((r) => r._id.toString() === roleId);

    user.active_role_id = role._id;
    await user.save();

    const updatedUser = await User.findById(userId)
      .populate("role_ids")
      .populate("active_role_id");

    const permissions = await getPermissionsByRole(
      updatedUser.active_role_id.name
    );

    const token = generateAccessToken({
      id: updatedUser._id,
      role: updatedUser.active_role_id.name,
      roleId: updatedUser.active_role_id._id,
      permissions,
    });

    return {
      token,
      user: mapUser(updatedUser),
      permissions,
    };
  },
};
export default authService;
