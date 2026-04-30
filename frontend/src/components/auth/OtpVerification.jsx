import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

const OtpVerification = ({
  form,
  setForm,
  contactLabel,
  onVerify,
  onResend,
  onBack,
  loading,
  resendLoading,
}) => {
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);

  // countdown
  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (!/^[0-9]?$/.test(value)) return;

    const otpArr = form.otp.split("");
    otpArr[index] = value;
    setForm({ ...form, otp: otpArr.join("") });

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !form.otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").slice(0, 6);
    if (!/^[0-9]{6}$/.test(paste)) return;

    setForm({ ...form, otp: paste });
    paste.split("").forEach((d, i) => {
      if (inputRefs.current[i]) {
        inputRefs.current[i].value = d;
      }
    });
    inputRefs.current[5]?.focus();
  };

  useEffect(() => {
    console.group("🔍 OTP UI STATE");
    console.log("timer:", timer);
    console.log("loading:", loading);
    console.log("resendLoading:", resendLoading);
    console.log("otp:", form.otp);
    console.groupEnd();
  }, [timer, loading, resendLoading, form.otp]);
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">Xác minh OTP</h2>

      <p className="text-sm text-gray-500">
        Nhập mã OTP gửi đến <span className="font-medium">{contactLabel}</span>
      </p>

      <div className="flex gap-2 justify-between" onPaste={handlePaste}>
        {[...Array(6)].map((_, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text"
            maxLength={1}
            className="w-12 h-12 border rounded text-center text-lg"
            value={form.otp[i] || ""}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
          />
        ))}
      </div>

      <button
        onClick={onVerify}
        disabled={loading || form.otp.length < 6}
        className="w-full py-3 rounded bg-blue-600 text-white"
      >
        {loading ? <Loader2 className="animate-spin mx-auto" /> : "Xác minh"}
      </button>

      {timer > 0 ? (
        <p className="text-center text-sm text-gray-500">
          Gửi lại sau {timer}s
        </p>
      ) : (
        <button
          onClick={() => {
            onResend();
            setTimer(60);
          }}
          disabled={resendLoading}
          className="text-sm text-blue-600 block mx-auto"
        >
          {resendLoading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : (
            "Gửi lại OTP"
          )}
        </button>
      )}

      {onBack && (
        <button
          onClick={onBack}
          className="text-sm text-gray-500 block mx-auto"
        >
          ← Quay lại
        </button>
      )}
    </div>
  );
};

export default OtpVerification;
