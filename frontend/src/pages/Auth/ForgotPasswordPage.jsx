import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Link } from "react-router-dom";

import {
  HiOutlineShieldCheck,
  HiOutlineLockClosed,
  HiOutlineClock,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

import { forgotPasswordApi } from "../../features/auth/authThunks";
import FormField from "../../components/common/FormField";
import SwitchMethodButton from "../../components/common/SwitchMethodButton";
import { openModal } from "../../features/modal/modalSlice";
import { selectForgotPasswordLoading } from "../../features/auth/authSlice";

const ForgotPasswordPage = () => {
  const dispatch = useDispatch();

  const { error, isAuthenticated } = useSelector((state) => state.auth);
  const loading = useSelector(selectForgotPasswordLoading);

  const [method, setMethod] = useState("email");
  const [contact, setContact] = useState("");
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const toggleMethod = (next) => {
    setMethod(next);
    setContact("");
    setFormError(null);
    setSuccess(false);
  };

  const validate = () => {
    if (!contact.trim()) return "Vui lòng nhập thông tin.";

    if (method === "email" && !/\S+@\S+\.\S+/.test(contact)) {
      return "Email không hợp lệ.";
    }

    if (method === "phone" && !/^(3|5|7|8|9)\d{8}$/.test(contact)) {
      return "Số điện thoại không hợp lệ.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);

    const err = validate();
    if (err) return setFormError(err);

    const res = await dispatch(forgotPasswordApi({ contact, method }));

    if (forgotPasswordApi.fulfilled.match(res)) {
      setSuccess(true);

      if (forgotPasswordApi.fulfilled.match(res)) {
        if (method === "phone") {
          dispatch(
            openModal({
              key: "AUTH",
              data: {
                initialStep: "otp",
                otpPurpose: "reset-password",
                phone: contact,
              },
            })
          );
        }
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-app overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-blue-500/15 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-8 py-24">
        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          {/* LEFT – CONTENT */}
          <div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              Khôi phục quyền truy cập <br />
              <span className="text-blue-600 dark:text-blue-400">
                tài khoản LMS
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Quy trình khôi phục được thiết kế để đảm bảo an toàn tuyệt đối,
              chỉ cho phép chính chủ tài khoản thực hiện.
            </p>

            <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex gap-3">
                <HiOutlineShieldCheck className="text-blue-500 text-xl" />
                Xác minh danh tính nghiêm ngặt
              </li>
              <li className="flex gap-3">
                <HiOutlineClock className="text-cyan-500 text-xl" />
                Phản hồi trong vài phút
              </li>
              <li className="flex gap-3">
                <HiOutlineLockClosed className="text-indigo-500 text-xl" />
                Mật khẩu được mã hóa
              </li>
              <li className="flex gap-3">
                <HiOutlineCheckCircle className="text-emerald-500 text-xl" />
                Không ảnh hưởng dữ liệu học tập
              </li>
            </ul>

            <div className="mt-14">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Quy trình khôi phục
              </h3>
              <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li>1. Chọn phương thức xác minh</li>
                <li>2. Nhận liên kết hoặc mã xác thực</li>
                <li>3. Thiết lập mật khẩu mới</li>
              </ol>
            </div>
          </div>

          {/* RIGHT – FORM */}
          <div className="w-full max-w-xl mx-auto rounded-2xl bg-card backdrop-blur-xl border border-gray-200/60 dark:border-white/10 p-12 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
            {/* Form header */}
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <HiOutlineLockClosed className="text-blue-600 dark:text-blue-400 text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold ">Quên mật khẩu</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Xác minh để khôi phục quyền truy cập
                </p>
              </div>
            </div>

            <SwitchMethodButton
              method={method}
              toggleMethod={toggleMethod}
              disabled={loading}
            />

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <FormField
                label={method === "email" ? "Email đăng ký" : "Số điện thoại"}
                name="contact"
                type={method === "email" ? "email" : "phone"}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                error={formError}
                disabled={loading}
                placeholder={
                  method === "email" ? "you@email.com" : "Nhập số điện thoại"
                }
              />

              {error && (
                <div className="flex gap-2 text-sm text-red-500 dark:text-red-400">
                  <HiOutlineShieldCheck className="mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex gap-2 rounded-lg border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-900/20 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                  <HiOutlineCheckCircle className="text-lg" />
                  <span>
                    Yêu cầu đã được gửi. Vui lòng kiểm tra{" "}
                    {method === "email" ? "email" : "SMS"} để tiếp tục.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full rounded-xl py-3.5
                  font-semibold text-white
                  bg-linear-to-r from-blue-600 to-cyan-500
                  shadow-lg shadow-blue-500/30
                  hover:brightness-110
                  active:scale-[0.98]
                  disabled:opacity-50
                  transition
                "
              >
                {loading ? "Đang xử lý..." : "Gửi yêu cầu khôi phục"}
              </button>
            </form>

            {/* Footer note */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <HiOutlineShieldCheck className="text-sm" />
              Thông tin của bạn được bảo vệ theo tiêu chuẩn bảo mật LMS
            </div>

            <div className="mt-6 text-center text-sm">
              <Link
                to="/login"
                className="text-indigo-600 dark:text-blue-400 hover:underline transition"
              >
                ← Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
