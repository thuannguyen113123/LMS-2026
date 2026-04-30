import React from "react";
import { MdClose } from "react-icons/md";
import { useSelector } from "react-redux";

import useAuth from "../../hooks/Auth/useAuth";
import AuthForm from "../form/AuthForm";
import OtpVerification from "./../auth/OtpVerification";
import LMSLogo from "./../logo/LMSLogo";

const AuthModal = ({ initialStep = "login", onClose }) => {
  const modalData = useSelector((state) => state.modals.modalData?.AUTH);
  const {
    step,
    setStep,
    method,
    toggleMethod,
    form,
    setForm,
    loading,

    otpLoading,
    resendLoading,
    oauthLoading,
    handleLogin,
    handleRegister,
    handleValidateOtp,
    handleLoginGoogle,
    handleLoginGithub,
    errors,
    formError,
    handleResendOtp,
  } = useAuth(modalData?.initialStep || initialStep, onClose, modalData);

  const onSubmit = () => {
    if (step === "login") handleLogin();
    else if (step === "register") handleRegister();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-3 sm:px-4">
      <div className="relative w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[95vh] overflow-y-auto bg-muted backdrop-blur rounded-2xl sm:rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.45)]  animate-slideDown">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[500px] md:min-h-[600px]">
          <div className="relative p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-center">
            <button
              onClick={onClose}
              className="absolute top-2 right-2 md:top-4 md:right-4 p-2 rounded-lg hover:bg-muted"
              type="button"
            >
              <MdClose size={24} />
            </button>
            {formError && (
              <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}
            {step === "otp" ? (
              <OtpVerification
                form={form}
                setForm={setForm}
                contactLabel={method === "email" ? form.email : form.phone}
                loading={otpLoading}
                resendLoading={resendLoading}
                onVerify={handleValidateOtp}
                onResend={handleResendOtp}
                onBack={() => setStep("register")}
              />
            ) : (
              <AuthForm
                step={step}
                method={method}
                form={form}
                setForm={setForm}
                toggleMethod={toggleMethod}
                handleSubmit={onSubmit}
                loading={loading}
                setStep={setStep}
                errors={errors}
                handleLoginGithub={handleLoginGithub}
                handleLoginGoogle={handleLoginGoogle}
                oauthLoading={oauthLoading}
                onClose={onClose}
              />
            )}
          </div>

          <div className="hidden md:flex relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-linear-to-br from-indigo-900 via-blue-800 to-slate-900" />

            {/* Noise / overlay */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

            {/* Accent shapes */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-[-120px] left-[-120px] w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-between h-full p-12 text-white">
              {/* Branding text */}
              <div className="space-y-4 max-w-sm">
                <h3 className="text-2xl font-semibold leading-snug">
                  Learn smarter. <br />
                  Build skills faster.
                </h3>
                <p className="text-sm text-white/70">
                  All-in-one LMS platform to manage learning, track progress and
                  scale knowledge across your organization.
                </p>
              </div>

              {/* Logo thay cho illustration */}
              <div className="flex justify-end">
                <div className="opacity-90 scale-125 drop-shadow-2xl">
                  <LMSLogo size={180} className="md:size-[200px] lg:size-60" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
