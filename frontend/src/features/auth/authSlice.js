import { createSlice } from "@reduxjs/toolkit";
import {
  fetchMe,
  forgotPasswordApi,
  loginApi,
  loginGithubApi,
  loginGoogleApi,
  logoutApi,
  registerApi,
  resendOtp,
  resetPasswordApi,
  restoreAuth,
  setPasswordApi,
  switchRoleApi,
  validateOtp,
  verifyResetOtpApi,
} from "./authThunks";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  error: null,
  loading: {
    login: false,
    oauth: false,
    register: false,
    validateOtp: false,
    resendOtp: false,
    forgotPassword: false,
    verifyResetOtp: false,
    resetPassword: false,
    setPassword: false,
    logout: false,
    switchRole: false,
  },
  otp: {
    lastAction: null,
    lastCode: null,
  },

  permissions: [],
  initialized: false,
  resetToken: null,
  tempToken: null,
  errorCode: null,
  lastActionCode: null,
  lastAction: null,
  lastCode: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action) {
      const user = action.payload.user;
      const token = action.payload.token;

      state.user = user
        ? {
            ...user,
            id: user.id || user._id,
            permissions: user.permissions || [],
          }
        : null;

      state.token = token || null;
      state.isAuthenticated = !!user && !!token;
    },
    saveTempToken(state, action) {
      state.tempToken = action.payload;
    },

    clearTempToken(state) {
      state.tempToken = null;
    },
    clearAuth(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(loginApi.pending, (state) => {
        state.loading.login = true;
        state.error = null;
      })

      .addCase(loginApi.fulfilled, (state, action) => {
        state.loading.login = false;
        state.token = action.payload.token;
        state.isAuthenticated = true;

        state.user = null;
        state.permissions = [];
      })
      .addCase(loginApi.rejected, (state, action) => {
        state.loading.login = false;
        state.error = action.payload || action.error.message;
      })

      // GOOGLE LOGIN
      .addCase(loginGoogleApi.pending, (state) => {
        state.loading.oauth = true;
        state.error = null;
      })
      .addCase(loginGoogleApi.fulfilled, (state, action) => {
        state.loading.oauth = false;

        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.lastActionCode = action.payload.code;
      })
      .addCase(loginGoogleApi.rejected, (state, action) => {
        state.loading.oauth = false;
        state.error = action.payload || action.error.message;
      })

      .addCase(restoreAuth.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.isAuthenticated = !!action.payload.token;
      })

      .addCase(restoreAuth.rejected, (state) => {
        state.initialized = true;
      })

      // GITHUB LOGIN
      .addCase(loginGithubApi.pending, (state) => {
        state.loading.oauth = true;
        state.error = null;
      })
      .addCase(loginGithubApi.fulfilled, (state, action) => {
        state.loading.oauth = false;
        if (action.payload.step2Required) {
          state.lastActionCode = action.payload.code;
          return;
        }

        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.lastActionCode = action.payload.code;
      })

      .addCase(loginGithubApi.rejected, (state, action) => {
        state.loading.oauth = false;
        state.error = action.payload || action.error.message;
      })

      // REGISTER
      .addCase(registerApi.pending, (state) => {
        state.loading.register = true;
        state.error = null;
      })
      .addCase(registerApi.fulfilled, (state, action) => {
        state.loading.register = false;
        state.lastRegisterCode = action.payload.code;
      })
      .addCase(registerApi.rejected, (state, action) => {
        state.loading.register = false;
        state.errorCode = action.payload?.code;
      })

      // VALIDATE OTP
      .addCase(validateOtp.pending, (state) => {
        state.loading.validateOtp = true;
        state.errorCode = null;
      })

      .addCase(validateOtp.fulfilled, (state, action) => {
        state.loading.validateOtp = false;
        state.lastActionCode = action.payload.code;

        state.token = action.payload.token;
        state.isAuthenticated = true;
      })

      .addCase(validateOtp.rejected, (state, action) => {
        state.loading.validateOtp = false;
        state.errorCode = action.payload?.code;
      })

      // SET PASSWORD
      .addCase(setPasswordApi.pending, (state) => {
        state.loading.setPassword = true;
        state.error = null;
      })
      .addCase(setPasswordApi.fulfilled, (state, action) => {
        state.loading.setPassword = false;

        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(setPasswordApi.rejected, (state, action) => {
        state.loading.setPassword = false;
        state.error = action.payload?.code || null;
      })
      .addCase(resendOtp.pending, (state) => {
        console.log("🔥 RESEND PENDING TRIGGERED");
        state.loading.resendOtp = true;
        state.error = null;
      })
      .addCase(resendOtp.fulfilled, (state, action) => {
        state.loading.resendOtp = false;
        state.otp = state.otp || {};
        state.otp.lastAction = "resend";
        state.otp.lastCode = action.payload.code;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.loading.resendOtp = false;
        state.otp.lastCode = action.payload?.code;
      })
      // FORGOT PASSWORD
      .addCase(forgotPasswordApi.pending, (state) => {
        state.loading.forgotPassword = true;
      })
      .addCase(forgotPasswordApi.fulfilled, (state) => {
        state.loading.forgotPassword = false;
      })
      .addCase(forgotPasswordApi.rejected, (state, action) => {
        state.loading.forgotPassword = false;
        state.error = action.payload?.code;
      })

      // RESET PASSWORD
      .addCase(resetPasswordApi.pending, (state) => {
        state.loading.resetPassword = true;
      })
      .addCase(resetPasswordApi.fulfilled, (state) => {
        state.loading.resetPassword = false;
        state.resetToken = null;
      })
      .addCase(resetPasswordApi.rejected, (state, action) => {
        state.loading.resetPassword = false;
        state.error = action.payload?.code;
      })
      // VERIFY RESET OTP (PHONE)
      .addCase(verifyResetOtpApi.pending, (state) => {
        state.loading.verifyResetOtp = true;
        state.error = null;
      })
      .addCase(verifyResetOtpApi.fulfilled, (state, action) => {
        state.loading.verifyResetOtp = false;
        state.resetToken = action.payload.resetToken; // 🔥 LƯU TOKEN
      })
      .addCase(verifyResetOtpApi.rejected, (state, action) => {
        state.loading.verifyResetOtp = false;
        state.error = action.payload?.code || null;
      })

      // LOGOUT
      .addCase(logoutApi.pending, (state) => {
        state.loading.logout = true;
        state.error = null;
      })
      .addCase(logoutApi.fulfilled, (state) => {
        state.loading.logout = false;

        Object.assign(state, {
          ...initialState,
          initialized: true,
        });
      })
      .addCase(logoutApi.rejected, (state, action) => {
        state.loading.logout = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(switchRoleApi.pending, (state) => {
        state.loading.switchRole = true;
      })

      .addCase(switchRoleApi.fulfilled, (state, action) => {
        state.loading.switchRole = false;
        state.token = action.payload.token;

        if (state.user) {
          state.user.activeRole = action.payload.activeRole;
        }

        // 👉 nếu có fetch lại /me
        if (action.payload.user) {
          const user = action.payload.user;

          state.user = {
            ...user,
            id: user.id || user._id,
          };
        }

        state.lastActionCode = action.payload.code;
      })

      .addCase(switchRoleApi.rejected, (state, action) => {
        state.loading.switchRole = false;
        state.errorCode = action.payload?.code;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.permissions = action.payload.permissions || [];
        state.isAuthenticated = true;
        state.initialized = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.permissions = [];
        state.isAuthenticated = false;
        state.token = null;
        state.initialized = true;
      });
  },
});

export const { setUser, clearAuth, saveTempToken, clearTempToken } =
  authSlice.actions;
export default authSlice.reducer;
export const selectAuthUser = (state) => state.auth.user;
export const selectAuthToken = (state) => state.auth.token;

export const selectAuthLoading = (state) => state.auth.loading;

export const selectLoginLoading = (state) => state.auth.loading.login;

export const selectOauthLoading = (state) => state.auth.loading.oauth;

export const selectRegisterLoading = (state) => state.auth.loading.register;

export const selectValidateOtpLoading = (state) =>
  state.auth.loading.validateOtp;

export const selectResendOtpLoading = (state) => state.auth.loading.resendOtp;

export const selectForgotPasswordLoading = (state) =>
  state.auth.loading.forgotPassword;

export const selectVerifyResetOtpLoading = (state) =>
  state.auth.loading.verifyResetOtp;

export const selectResetPasswordLoading = (state) =>
  state.auth.loading.resetPassword;

export const selectSetPasswordLoading = (state) =>
  state.auth.loading.setPassword;

export const selectLogoutLoading = (state) => state.auth.loading.logout;
