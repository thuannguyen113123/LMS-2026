import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, Navigate, Link } from "react-router-dom";
import {
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";

import { resetPasswordApi } from "../../features/auth/authThunks";
import FormField from "../../components/common/FormField";
import LMSLogo from "../../components/logo/LMSLogo";
import { selectResetPasswordLoading } from "../../features/auth/authSlice";

const ResetPasswordPage = () => {
  const dispatch = useDispatch();
  const { error, isAuthenticated } = useSelector((state) => state.auth);
  const loading = useSelector(selectResetPasswordLoading);

  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get("token");
  const resetToken = useSelector((state) => state.auth.resetToken);

  const finalToken = urlToken || resetToken;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    if (!password || !confirmPassword) {
      return "Vui lòng nhập đầy đủ mật khẩu.";
    }

    if (password.length < 6) {
      return "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    if (password !== confirmPassword) {
      return "Mật khẩu xác nhận không khớp.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const err = validate();
    if (err) return setFormError(err);

    const res = await dispatch(
      resetPasswordApi({
        token: finalToken,
        password,
      })
    );

    if (resetPasswordApi.fulfilled.match(res)) {
      setSuccess(true);
    }
  };

  return (
    <div className="relative min-h-screen bg-app overflow-hidden">
      {/* Glow background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          {/* LEFT */}
          <div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              Thiết lập mật khẩu mới <br />
              <span className="text-indigo-600 dark:text-indigo-400">
                cho tài khoản LMS
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Mật khẩu mới sẽ thay thế hoàn toàn mật khẩu cũ và có hiệu lực ngay
              sau khi xác nhận thành công.
            </p>

            <ul className="mt-10 space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex gap-3">
                <HiOutlineShieldCheck className="text-indigo-500 text-xl" />
                Liên kết chỉ sử dụng một lần
              </li>
              <li className="flex gap-3">
                <HiOutlineLockClosed className="text-blue-500 text-xl" />
                Mật khẩu được mã hóa an toàn
              </li>
              <li className="flex gap-3">
                <HiOutlineCheckCircle className="text-emerald-500 text-xl" />
                Hoàn tất trong vài giây
              </li>
            </ul>
          </div>

          {/* RIGHT – FORM */}
          <div
            className="
              w-full max-w-xl mx-auto
              rounded-2xl
              bg-white/85 dark:bg-gray-900/80
              backdrop-blur-xl
              border border-gray-200/60 dark:border-white/10
              p-12
              shadow-[0_40px_100px_rgba(0,0,0,0.6)]
            "
          >
            {/* Header */}
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10">
                <HiOutlineLockClosed className="text-indigo-600 dark:text-indigo-400 text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Đặt lại mật khẩu
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Thiết lập mật khẩu mới cho tài khoản
                </p>
              </div>
            </div>

            {/* ❌ Link sai */}
            {!finalToken && (
              <div className="rounded-lg border border-red-500/40 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300 flex gap-3">
                <HiOutlineExclamationTriangle className="text-lg mt-0.5" />
                <div>
                  <p className="font-medium">Liên kết không hợp lệ</p>
                  <p className="mt-1">
                    Liên kết đã hết hạn hoặc không tồn tại.
                  </p>
                  <Link
                    to="/forgot-password"
                    className="inline-block mt-2 underline font-medium"
                  >
                    Thử lại quên mật khẩu
                  </Link>
                </div>
              </div>
            )}

            {/* ✅ Thành công */}
            {finalToken && success && (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-900/20 p-4 text-sm text-emerald-700 dark:text-emerald-300 flex gap-3">
                <HiOutlineCheckCircle className="text-lg mt-0.5" />
                <div>
                  <p className="font-medium">
                    Mật khẩu đã được cập nhật thành công
                  </p>
                  <Link
                    to="/login"
                    className="inline-block mt-2 underline font-medium"
                  >
                    Quay lại đăng nhập
                  </Link>
                </div>
              </div>
            )}

            {/* FORM */}
            {finalToken && !success && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormField
                  label="Mật khẩu mới"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />

                <FormField
                  label="Xác nhận mật khẩu"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  error={formError}
                />

                {error && (
                  <div className="flex gap-2 text-sm text-red-500 dark:text-red-400">
                    <HiOutlineShieldCheck className="mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full rounded-xl py-3.5
                    font-semibold text-white
                    bg-linear-to-r from-indigo-600 to-blue-500
                    shadow-lg shadow-indigo-500/30
                    hover:brightness-110
                    active:scale-[0.98]
                    disabled:opacity-50
                    transition
                  "
                >
                  {loading ? "Đang xử lý..." : "Xác nhận mật khẩu mới"}
                </button>
              </form>
            )}

            {/* Footer */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <HiOutlineShieldCheck className="text-sm" />
              Tiêu chuẩn bảo mật tài khoản LMS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
