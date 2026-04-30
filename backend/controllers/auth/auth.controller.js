import AuthService from "../../services/auth/auth.services.js";
import { AUTH_CODES } from "./../../utils/helpers.js";
import AppError from "../../utils/AppError.js";

export const authController = {
  // Đăng ký
  async register(req, res) {
    try {
      const result = await AuthService.register(req.body);

      return res.status(200).json({
        success: true,
        code: AUTH_CODES.OTP_SENT,
        message: "OTP đã được gửi",
        data: result,
      });
    } catch (err) {
      console.error("Register error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: AUTH_CODES.SERVER_ERROR,
        message: "Lỗi hệ thống",
      });
    }
  },
  //Xác thực OTP
  async verifyOtp(req, res) {
    try {
      const result = await AuthService.verifyOtp(req.body);

      res.cookie("access_token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 15,
      });

      return res.json({
        success: true,
        code: AUTH_CODES.OTP_VERIFIED,
        message: "Xác thực OTP thành công",
        data: result,
      });
    } catch (err) {
      console.error("Verify OTP error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: AUTH_CODES.SERVER_ERROR,
        message: "Lỗi server",
      });
    }
  },
  //Gửi lại mã OTP
  async resendOtp(req, res) {
    try {
      const result = await AuthService.resendOtp(req.body);

      return res.json({
        success: true,
        code: AUTH_CODES.OTP_SENT,
        message: "Mã OTP đã được gửi lại",
        data: result,
      });
    } catch (err) {
      console.error("Resend OTP error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: AUTH_CODES.SERVER_ERROR,
        message: "Lỗi server",
      });
    }
  },
  // Đăng nhập
  async login(req, res) {
    try {
      const result = await AuthService.login(req.body);

      res.cookie("access_token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 15,
      });

      return res.status(200).json({
        success: true,
        code: AUTH_CODES.LOGIN_SUCCESS,
        message: "Đăng nhập thành công",
        data: result,
      });
    } catch (err) {
      console.error("Login error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: AUTH_CODES.SERVER_ERROR,
        message: "Lỗi server",
      });
    }
  },
  //Đăng xuất
  logout(req, res) {
    try {
      res.clearCookie("access_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return res.json({
        success: true,
        code: AUTH_CODES.LOGOUT_SUCCESS,
        message: "Đăng xuất thành công",
      });
    } catch (err) {
      console.error("Logout error:", err);
      return res.status(500).json({
        success: false,
        code: AUTH_CODES.SERVER_ERROR,
        message: "Lỗi server",
      });
    }
  },

  // Đăng nhập với Google
  async loginGoogle(req, res) {
    try {
      const result = await AuthService.loginGoogle(req.firebaseUser);

      res.cookie("access_token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 15,
      });

      return res.status(200).json({
        success: true,
        code: AUTH_CODES.GOOGLE_LOGIN_SUCCESS,
        message: "Đăng nhập Google thành công",
        data: result,
      });
    } catch (err) {
      console.error("Google login error:", err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: AUTH_CODES.SERVER_ERROR,
        message: "Lỗi server",
      });
    }
  },

  // Đăng nhập với GitHub
  async loginGithub(req, res) {
    try {
      const result = await AuthService.loginGithub(req.firebaseUser);

      res.cookie("access_token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 15,
      });

      return res.status(200).json({
        success: true,
        code: AUTH_CODES.GITHUB_LOGIN_SUCCESS,
        message: "Đăng nhập GitHub thành công",
        data: result,
      });
    } catch (err) {
      console.error("GitHub login error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: AUTH_CODES.SERVER_ERROR,
        message: "Lỗi server",
      });
    }
  },

  async setPassword(req, res) {
    try {
      const result = await AuthService.setPassword(req.body);

      res.cookie("access_token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 15,
      });

      return res.status(200).json({
        success: true,
        code: AUTH_CODES.SET_PASSWORD_SUCCESS,
        message: "Đặt mật khẩu thành công",
        data: result,
      });
    } catch (err) {
      console.error("SET PASSWORD ERROR:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: AUTH_CODES.SERVER_ERROR,
        message: "Lỗi hệ thống",
      });
    }
  },

  async forgotPassword(req, res) {
    try {
      await AuthService.forgotPassword(req.body);

      return res.status(200).json({
        success: true,
        code: AUTH_CODES.FORGOT_PASSWORD_SENT,
        message: "Nếu tài khoản tồn tại, hướng dẫn đã được gửi",
      });
    } catch (err) {
      console.error("Forgot password error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: AUTH_CODES.SERVER_ERROR,
        message: "Lỗi server",
      });
    }
  },
  //Reset mật khẩu
  async resetPassword(req, res) {
    try {
      await AuthService.resetPassword(req.body);

      return res.status(200).json({
        success: true,
        code: AUTH_CODES.RESET_PASSWORD_SUCCESS,
        message: "Đặt lại mật khẩu thành công",
      });
    } catch (err) {
      console.error("Reset password error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: AUTH_CODES.SERVER_ERROR,
        message: "Lỗi server",
      });
    }
  },

  //Xác thực otp để xin ra link reset pass
  async verifyResetOtp(req, res) {
    try {
      const result = await AuthService.verifyResetOtp(req.body);

      return res.status(200).json({
        success: true,
        code: AUTH_CODES.RESET_PASSWORD_OTP_VERIFIED,
        message: "Xác thực OTP thành công",
        data: result,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      console.error("verifyResetOtp error:", err);

      return res.status(500).json({
        success: false,
        code: AUTH_CODES.SERVER_ERROR,
        message: "Lỗi server",
      });
    }
  },

  //SetPass bằng OTP khi admin tạo user
  async verifySetPasswordOtp(req, res) {
    try {
      const result = await AuthService.verifySetPasswordOtp(req.validatedBody);

      return res.status(200).json({
        success: true,
        code: AUTH_CODES.SET_PASSWORD_OTP_VERIFIED,
        message: "Xác thực OTP thành công",
        data: result,
      });
    } catch (err) {
      console.error("verifySetPasswordOtp error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: AUTH_CODES.SERVER_ERROR,
        message: "Lỗi server",
      });
    }
  },
  async me(req, res) {
    try {
      const result = await AuthService.me(req.user.id);

      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
  async switchRole(req, res) {
    try {
      const result = await AuthService.switchRole({
        userId: req.user.id,
        roleId: req.body.roleId,
      });

      return res.json({
        success: true,
        code: "AUTH_SWITCH_ROLE_SUCCESS",
        message: "Chuyển role thành công",
        data: result,
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || "AUTH_SWITCH_ROLE_FAILED",
        message: err.message,
      });
    }
  },
};
