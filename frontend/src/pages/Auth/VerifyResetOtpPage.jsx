import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import OtpVerification from "../../components/auth/OtpVerification";
import { verifyResetOtpApi, resendOtp } from "../../features/auth/authThunks";

const VerifyResetOtpPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading, resetToken } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    phone: state?.phone || "",
    otp: "",
  });

  useEffect(() => {
    if (!state?.phone) {
      navigate("/forgot-password", { replace: true });
    }
  }, [state, navigate]);

  useEffect(() => {
    if (resetToken) {
      navigate(`/reset-password?token=${resetToken}`);
    }
  }, [resetToken, navigate]);

  if (!state?.phone) return null;

  return (
    <OtpVerification
      form={form}
      setForm={setForm}
      contactLabel={form.phone}
      loading={loading}
      onVerify={() =>
        dispatch(verifyResetOtpApi({ phone: form.phone, otp: form.otp }))
      }
      onResend={() =>
        dispatch(resendOtp({ phone: form.phone, type: "reset-password-otp" }))
      }
      onBack={() => navigate("/forgot-password")}
    />
  );
};

export default VerifyResetOtpPage;
