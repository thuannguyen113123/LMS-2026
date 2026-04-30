import { createAsyncThunk } from "@reduxjs/toolkit";
import { addToast, setTheme } from "../ui/uiSlice";
import api from "../../app/api.js";

export const toastMap = {
  AUTH_LOGIN_SUCCESS: {
    type: "success",
    message: "Đăng nhập thành công",
  },
  AUTH_LOGOUT_SUCCESS: {
    type: "success",
    message: "Đăng xuất thành công",
  },
  AUTH_GOOGLE_LOGIN_SUCCESS: {
    type: "success",
    message: "Đăng nhập Google thành công",
  },
  AUTH_GOOGLE_TOKEN_INVALID: {
    type: "error",
    message: "Google token không hợp lệ",
  },

  AUTH_GITHUB_LOGIN_SUCCESS: {
    type: "success",
    message: "Đăng nhập GitHub thành công",
  },
  AUTH_ACCOUNT_PROVIDER_CONFLICT: {
    type: "error",
    message: "Email đã đăng ký bằng phương thức khác",
  },

  AUTH_GITHUB_TOKEN_INVALID: {
    type: "error",
    message: "GitHub token không hợp lệ",
  },
  AUTH_USER_NOT_FOUND: {
    type: "error",
    message: "Tài khoản không tồn tại",
  },
  AUTH_USER_NOT_ACTIVE: {
    type: "warning",
    message: "Tài khoản chưa xác thực OTP",
  },
  AUTH_PASSWORD_INVALID: {
    type: "error",
    message: "Mật khẩu không đúng",
  },
  AUTH_OTP_VERIFIED: {
    type: "success",
    message: "Xác thực thành công",
  },
  AUTH_OTP_INVALID: {
    type: "error",
    message: "Mã OTP không đúng hoặc đã hết hạn",
  },
  AUTH_OTP_SENT: {
    type: "info",
    message: "Mã OTP đã được gửi",
  },
  AUTH_USER_EXISTS: {
    type: "error",
    message: "Tài khoản đã tồn tại",
  },
  AUTH_CONTACT_INVALID: {
    type: "error",
    message: "Thông tin liên hệ không hợp lệ",
  },

  SERVER_ERROR: {
    type: "error",
    message: "Lỗi hệ thống, vui lòng thử lại",
  },
  // --- SET PASSWORD ---
  AUTH_SET_PASSWORD_SUCCESS: {
    type: "success",
    message: "Đặt mật khẩu thành công",
  },
  AUTH_SET_PASSWORD_TOKEN_INVALID: {
    type: "error",
    message: "Link đặt mật khẩu không hợp lệ",
  },
  AUTH_SET_PASSWORD_TOKEN_EXPIRED: {
    type: "error",
    message: "Link đặt mật khẩu đã hết hạn",
  },
  AUTH_SET_PASSWORD_MISSING_DATA: {
    type: "error",
    message: "Thiếu thông tin đặt mật khẩu",
  },
  AUTH_FORGOT_PASSWORD_SENT: {
    type: "info",
    message: "Nếu tài khoản tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi",
  },

  AUTH_RESET_PASSWORD_SUCCESS: {
    type: "success",
    message: "Đặt lại mật khẩu thành công",
  },
  AUTH_RESET_PASSWORD_TOKEN_INVALID: {
    type: "error",
    message: "Link không hợp lệ",
  },
  AUTH_RESET_PASSWORD_TOKEN_EXPIRED: {
    type: "error",
    message: "Link đã hết hạn",
  },
  AUTH_SWITCH_ROLE_SUCCESS: {
    type: "success",
    message: "Chuyển quyền thành công",
  },
  AUTH_SWITCH_ROLE_FAILED: {
    type: "error",
    message: "Chuyển quyền thất bại",
  },
};

export const loginApi = createAsyncThunk(
  "auth/login",
  async ({ contact, password, method }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/auth/login", {
        contact,
        password,
        method,
      });

      const { code, data } = res.data;

      localStorage.setItem("accessToken", data.token);
      dispatch(setTheme(data.user?.preferences?.theme || "light"));

      // Toast theo code
      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        token: data.token,
        user: data.user,
        permissions: data.permissions,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const restoreAuth = createAsyncThunk(
  "auth/restoreAuth",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        return rejectWithValue();
      }

      // 👉 chỉ xác nhận token tồn tại
      return { token };
    } catch {
      return rejectWithValue();
    }
  }
);

export const loginGithubApi = createAsyncThunk(
  "auth/loginGithub",
  async ({ idToken }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post(
        "/auth/github",
        {},
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      const { code, data } = res.data;

      localStorage.setItem("accessToken", data.token);
      dispatch(setTheme(data.user?.preferences?.theme || "light"));

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));
      return {
        code,
        token: data.token,
        user: data.user,
        isNew: data.isNew,
        permissions: data.permissions,
      };
    } catch (err) {
      const code = err.response?.data?.code || "SERVER_ERROR";
      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));
      return rejectWithValue({ code });
    }
  }
);

// LOGIN GOOGLE
export const loginGoogleApi = createAsyncThunk(
  "auth/loginGoogle",
  async ({ idToken }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post(
        "/auth/google",
        {},
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      const { code, data } = res.data;

      localStorage.setItem("accessToken", data.token);
      dispatch(setTheme(data.user?.preferences?.theme || "light"));

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        token: data.token,
        user: data.user,
        isNew: data.isNew,
        permissions: data.permissions,
      };
    } catch (err) {
      const code = err.response?.data?.code || "SERVER_ERROR";
      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));
      return rejectWithValue({ code });
    }
  }
);

// REGISTER -> gửi OTP
export const registerApi = createAsyncThunk(
  "auth/register",
  async (
    { fullname, contact, password, method },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const res = await api.post("/auth/register", {
        fullname,
        contact,
        password,
        method,
      });

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return { code, data };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// XÁC THỰC OTP (sau khi đăng ký hoặc reset mật khẩu)
export const validateOtp = createAsyncThunk(
  "auth/validateOtp",
  async ({ contact, code }, { dispatch, rejectWithValue }) => {
    try {
      const payload = contact.includes("@")
        ? { email: contact, accessCode: code }
        : { phone: contact, accessCode: code };

      const res = await api.post("/auth/validate-otp", payload);

      const { code: responseCode, data } = res.data;

      const toast = toastMap[responseCode];
      if (toast) dispatch(addToast(toast));

      localStorage.setItem("accessToken", data.token);

      return {
        code: responseCode,
        user: data.user,
        token: data.token,
        permissions: data.permissions,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

//Gửi lại OTP
export const resendOtp = createAsyncThunk(
  "auth/resendOtp",
  async ({ contact, purpose }, { dispatch, rejectWithValue }) => {
    try {
      const payload = contact.includes("@")
        ? { email: contact, purpose }
        : { phone: contact, purpose };

      const res = await api.post("/auth/resend-otp", payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return { code, data };
    } catch (err) {
      const code = err.response?.data?.code || "SERVER_ERROR";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// SET PASSWORD (dành cho user được admin tạo)
export const setPasswordApi = createAsyncThunk(
  "auth/set-password",
  async ({ token, password }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/auth/set-password", {
        token,
        password,
      });

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      // lưu token nếu cần
      if (data?.token) {
        localStorage.setItem("accessToken", data.token);
      }

      return data;
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const forgotPasswordApi = createAsyncThunk(
  "auth/forgot-password",
  async ({ contact, method }, { dispatch }) => {
    try {
      const payload =
        method === "email" ? { email: contact } : { phone: contact };

      const res = await api.post("/auth/forgot-password", payload);

      const { code } = res.data;
      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      // ✅ LUÔN fulfilled
      return { code: code ?? "SERVER_ERROR" };
    } catch (err) {
      // ❌ CHỈ toast khi server chết
      dispatch(addToast(toastMap.SERVER_ERROR));
      console.log(err);

      return { code: "SERVER_ERROR" };
    }
  }
);

export const resetPasswordApi = createAsyncThunk(
  "auth/reset-password",
  async ({ token, password }, { dispatch }) => {
    try {
      const res = await api.post("/auth/reset-password", {
        token,
        password,
      });

      const { code } = res.data;
      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return { code };
    } catch (err) {
      const code = err.response?.data?.code || "SERVER_ERROR";
      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      // ✅ vẫn fulfilled để UI xử lý message
      return { code };
    }
  }
);
export const verifyResetOtpApi = createAsyncThunk(
  "auth/verify-reset-otp",
  async ({ phone, otp }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/auth/verify-reset-otp", {
        phone,
        otp,
      });

      return { resetToken: res.data.data.resetToken };
    } catch (err) {
      const code = err.response?.data?.code || "SERVER_ERROR";
      dispatch(addToast(toastMap[code]));
      return rejectWithValue({ code });
    }
  }
);

// VERIFY SET PASSWORD OTP (admin tạo user)
export const verifySetPasswordOtp = createAsyncThunk(
  "auth/verify-set-password-otp",
  async ({ phone, otp }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/auth/verify-set-password-otp", {
        phone,
        otp,
      });

      const { code, token } = res.data;

      // toast theo code
      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      // ⚠️ KHÔNG lưu accessToken
      // đây là token tạm để set password
      return { token };
    } catch (err) {
      const code = err.response?.data?.code || "SERVER_ERROR";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// LOGOUT
export const logoutApi = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/auth/logout");

      const { code } = res.data;
      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      localStorage.removeItem("accessToken");

      return true;
    } catch (err) {
      const code = err.response?.data?.code || "SERVER_ERROR";
      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue(code);
    }
  }
);
export const switchRoleApi = createAsyncThunk(
  "auth/switchRole",
  async ({ roleId }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/auth/switchRole", { roleId });

      const { code, data } = res.data;

      // ✅ token mới từ backend
      if (data?.token) {
        localStorage.setItem("accessToken", data.token);

        // optional update runtime header luôn
        api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
      }

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        ...data,
      };
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);

export const fetchMe = createAsyncThunk(
  "auth/me",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        return rejectWithValue({ code: "NO_TOKEN" });
      }

      const res = await api.get("/auth/me");

      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);
