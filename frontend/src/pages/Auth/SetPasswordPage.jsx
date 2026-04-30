import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, Navigate } from "react-router-dom";

import { setPasswordApi } from "../../features/auth/authThunks";
import FormField from "../../components/common/FormField";

const SetPasswordPage = () => {
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState(null);

  if (!token)
    return (
      <p className="text-center mt-10 text-red-600">
        Token không hợp lệ hoặc bị thiếu.
      </p>
    );

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);

    if (!password) {
      setFormError("Vui lòng nhập mật khẩu mới.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Mật khẩu xác nhận không khớp.");
      return;
    }

    dispatch(setPasswordApi({ token, password }));
  };

  return (
    <div className="max-w-md mx-auto mt-30 p-6 border rounded-md shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-center">
        Đặt lại mật khẩu
      </h2>

      <form onSubmit={handleSubmit}>
        <FormField
          label="Mật khẩu mới"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={formError && !password ? formError : null}
          required
          disabled={loading}
          placeholder="Nhập mật khẩu mới"
        />

        <FormField
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={formError && password !== confirmPassword ? formError : null}
          required
          disabled={loading}
          placeholder="Nhập lại mật khẩu"
        />

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded transition"
        >
          {loading ? "Đang xử lý..." : "Đặt mật khẩu"}
        </button>
      </form>
    </div>
  );
};

export default SetPasswordPage;
