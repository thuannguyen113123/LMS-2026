import React from "react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { Loader2 } from "lucide-react";

import SwitchMethodButton from "../common/SwitchMethodButton";
import SubmitButton from "../common/SubmitButton";
import FormField from "../common/FormField";
import { useNavigate } from "react-router-dom";

const AuthForm = ({
  step,
  method,
  form,
  setForm,
  toggleMethod,
  handleSubmit,
  loading,
  setStep,
  errors,
  onClose,
  handleLoginGithub,
  handleLoginGoogle,
  oauthLoading,
}) => {
  const onChangeField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const navigate = useNavigate();

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {step === "login" && (
        <>
          <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
            Welcome Back
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Login in to your LMS dashboard and continue learning
          </p>
        </>
      )}
      {step === "register" && (
        <>
          <h2 className="text-3xl font-bold  mb-2">Create Account</h2>
          <p className="text-gray-500 text-sm mb-8">
            Sign up to start your LMS journey
          </p>
        </>
      )}

      {step === "register" && (
        <div className="flex flex-col gap-2">
          <FormField
            type="text"
            name="fullname"
            label="Họ tên"
            value={form.fullname}
            onChange={onChangeField("fullname")}
            error={errors.fullname}
            placeholder="Nhập họ tên"
            disabled={loading}
          />
        </div>
      )}

      {method === "email" ? (
        <div className="flex flex-col gap-2">
          <FormField
            type="email"
            name="email"
            label="Email"
            placeholder="Nhập email"
            value={form.email}
            onChange={onChangeField("email")}
            error={errors.email}
            required
            disabled={loading}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <FormField
            type="phone"
            name="phone"
            label="Số điện thoại"
            value={form.phone}
            onChange={onChangeField("phone")}
            error={errors.phone}
            placeholder="912345678"
            required
            disabled={loading}
          />
        </div>
      )}

      {(step === "login" || step === "register") && (
        <FormField
          type="password"
          name="password"
          label="Mật khẩu"
          placeholder="Nhập mật khẩu"
          value={form.password}
          onChange={onChangeField("password")}
          error={errors.password}
          required
          disabled={loading}
        />
      )}

      <SwitchMethodButton
        method={method}
        toggleMethod={toggleMethod}
        disabled={loading}
        className="h-11 sm:h-12 text-sm sm:text-base"
      />

      <SubmitButton onClick={handleSubmit} loading={loading} disabled={loading}>
        {step === "login" ? "Login" : "Register"}
      </SubmitButton>
      <button
        type="button"
        onClick={() => {
          onClose();
          navigate("/forgot-password");
        }}
        className="text-xs sm:text-sm text-indigo-600 hover:underline"
      >
        Quên mật khẩu?
      </button>

      {step === "login" && (
        <>
          <div className="relative my-4 sm:my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t text-black" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 text-gray-400">Or Login With</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleLoginGoogle}
              disabled={oauthLoading}
              className={`w-full h-11 sm:h-12 rounded-xl font-medium shadow-lg flex items-center justify-center py-1 gap-2 border border-gray-200 hover-bg-muted
                ${
                  loading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
                }
              `}
            >
              {oauthLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <FcGoogle size={20} />
              )}
            </button>
            <button
              onClick={handleLoginGithub}
              disabled={oauthLoading}
              className={`w-full h-11 sm:h-12 rounded-xl font-medium shadow-lg flex items-center justify-center py-1 gap-2 border border-gray-200 hover-bg-muted
                ${
                  loading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
                }
              `}
            >
              {oauthLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <FaGithub size={20} />
              )}
            </button>
          </div>
        </>
      )}

      {step === "login" && (
        <p className="text-center text-[11px] sm:text-xs text-gray-500 mt-4 sm:mt-6">
          Don’t have an account?{" "}
          <button
            disabled={loading}
            onClick={() => setStep("register")}
            className="text-blue-600 font-medium hover:underline"
            type="button"
          >
            Register Now
          </button>
        </p>
      )}

      {step === "register" && (
        <p className="text-center text-xs text-gray-500 mt-6">
          Already have an account?
          <button
            onClick={() => setStep("login")}
            className="text-blue-600 font-medium hover:underline ml-1"
            type="button"
          >
            Login
          </button>
        </p>
      )}
    </div>
  );
};

export default AuthForm;
