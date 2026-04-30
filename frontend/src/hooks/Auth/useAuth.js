import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  fetchMe,
  loginApi,
  loginGithubApi,
  registerApi,
  resendOtp,
  validateOtp,
  verifyResetOtpApi,
  verifySetPasswordOtp,
} from "../../features/auth/authThunks";
import { loginGoogleApi } from "../../features/auth/authThunks";
import {
  GithubAuthProvider,
  signInWithPopup,
  GoogleAuthProvider,
  linkWithCredential,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { auth } from "../../config/firebase";
import {
  saveTempToken,
  selectLoginLoading,
  selectOauthLoading,
  selectRegisterLoading,
  selectResendOtpLoading,
  selectValidateOtpLoading,
} from "../../features/auth/authSlice";
import { startAppLoading, stopAppLoading } from "../../features/ui/uiSlice";

export const authFormErrorMap = {
  AUTH_USER_EXISTS: "Tài khoản đã tồn tại",
  AUTH_CONTACT_INVALID: "Thông tin liên hệ không hợp lệ",
};
const useAuth = (initialStep, onClose, modalData) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const loginLoading = useSelector(selectLoginLoading);
  const registerLoading = useSelector(selectRegisterLoading);
  const otpLoading = useSelector(selectValidateOtpLoading);
  const resendLoading = useSelector(selectResendOtpLoading);
  const oauthLoading = useSelector(selectOauthLoading);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  // Local state
  const [step, setStep] = useState(initialStep);
  const [method, setMethod] = useState("email");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    phone: modalData?.phone || "",
    password: "",
    otp: "",
  });
  const [errors, setErrors] = useState({});
  const [otpPurpose, setOtpPurpose] = useState(modalData?.otpPurpose || null);

  const loading =
    step === "login"
      ? loginLoading || oauthLoading
      : step === "register"
      ? registerLoading
      : step === "otp"
      ? otpLoading
      : false;

  const contact = method === "email" ? form.email : form.phone;
  useEffect(() => {
    setErrors({});
    setFormError("");
  }, [step, method]);

  //Validate
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (step === "register") {
      if (!form.fullname.trim()) newErrors.fullname = "Vui lòng nhập họ tên";
      else if (form.fullname.length < 2) newErrors.fullname = "Họ tên quá ngắn";

      if (method === "email") {
        if (!form.email) newErrors.email = "Vui lòng nhập email";
        else if (!/\S+@\S+\.\S+/.test(form.email))
          newErrors.email = "Email không hợp lệ";
      } else {
        if (!form.phone) {
          newErrors.phone = "Vui lòng nhập số điện thoại";
        } else if (!/^(3|5|7|8|9)\d{8}$/.test(form.phone)) {
          newErrors.phone = "Số điện thoại không hợp lệ";
        }
      }
    }

    if (!form.password) newErrors.password = "Vui lòng nhập mật khẩu";
    else if (form.password.length < 6)
      newErrors.password = "Mật khẩu tối thiểu 6 ký tự";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, method, step]);

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      dispatch(startAppLoading());

      const result = await dispatch(
        registerApi({
          fullname: form.fullname,
          contact,
          password: form.password,
          method,
        })
      );

      if (
        registerApi.fulfilled.match(result) &&
        result.payload.code === "AUTH_OTP_SENT"
      ) {
        setOtpPurpose("register");
        setStep("otp");
      }

      if (registerApi.rejected.match(result)) {
        const code = result.payload?.code;
        const formMessage = authFormErrorMap[code];
        if (formMessage) setFormError(formMessage);
      }
    } finally {
      dispatch(stopAppLoading());
    }
  };

  // Hàm xử lý validate OTP
  const handleValidateOtp = useCallback(async () => {
    if (!form.otp.trim()) {
      setErrors((p) => ({ ...p, otp: "Vui lòng nhập mã OTP" }));
      return;
    }
    try {
      dispatch(startAppLoading());
      // REGISTER
      if (otpPurpose === "register") {
        const result = await dispatch(validateOtp({ contact, code: form.otp }));

        if (validateOtp.fulfilled.match(result)) {
          await dispatch(fetchMe());
          onClose();
          navigate("/redirect");
        }
        return;
      }

      // RESET PASSWORD
      if (otpPurpose === "reset-password") {
        const result = await dispatch(
          verifyResetOtpApi({
            phone: form.phone,
            otp: form.otp,
          })
        );

        if (verifyResetOtpApi.fulfilled.match(result)) {
          onClose();
          navigate(`/reset-password?token=${result.payload.resetToken}`);
        }
        return;
      }

      // SET PASSWORD
      if (otpPurpose === "set-password") {
        const result = await dispatch(
          verifySetPasswordOtp({
            phone: form.phone,
            otp: form.otp,
          })
        );

        if (verifySetPasswordOtp.fulfilled.match(result)) {
          dispatch(saveTempToken(result.payload.token));
          onClose();
          navigate("/set-password");
        }
        return;
      }
    } finally {
      dispatch(stopAppLoading());
    }
  }, [otpPurpose, form.otp, form.phone, contact, dispatch, navigate, onClose]);

  // Hàm xử lý đăng nhập
  const handleLogin = useCallback(async () => {
    if (!validateForm()) return;
    try {
      dispatch(startAppLoading());
      const result = await dispatch(
        loginApi({
          contact,
          password: form.password,
          method,
        })
      );

      if (loginApi.fulfilled.match(result)) {
        await dispatch(fetchMe());
        onClose();
        navigate("/redirect");
      }
    } finally {
      dispatch(stopAppLoading()); // tắt spinner
    }
  }, [
    dispatch,
    contact,
    form.password,
    method,
    navigate,
    validateForm,
    onClose,
  ]);

  // LOGIN GOOGLE
  const handleLoginGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const apiResult = await dispatch(loginGoogleApi({ idToken }));
      if (loginGoogleApi.fulfilled.match(apiResult)) {
        await dispatch(fetchMe());
        onClose();
        navigate("/redirect");
      }
    } catch (err) {
      console.error("Login Google Error:", err);
    }
  }, [dispatch, navigate, onClose]);

  // LOGIN GITHUB

  const handleLoginGithub = async () => {
    const provider = new GithubAuthProvider();
    provider.addScope("user:email");

    try {
      // 🔹 Login GitHub bình thường
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken(true);

      const apiResult = await dispatch(loginGithubApi({ idToken }));
      if (loginGithubApi.fulfilled.match(apiResult)) {
        await dispatch(fetchMe());
        onClose();
        navigate("/redirect");
      }
    } catch (err) {
      // 🔥 CASE ĐẶC BIỆT
      if (err.code === "auth/account-exists-with-different-credential") {
        const email = err.customData.email;
        const pendingCred = GithubAuthProvider.credentialFromError(err);

        // 1️⃣ Lấy provider cũ
        const methods = await fetchSignInMethodsForEmail(auth, email);

        // 2️⃣ Nếu từng login bằng Google
        if (methods.includes("google.com")) {
          const googleProvider = new GoogleAuthProvider();

          // Login Google
          const googleResult = await signInWithPopup(auth, googleProvider);

          // 3️⃣ Link GitHub vào account Google
          await linkWithCredential(googleResult.user, pendingCred);

          // 4️⃣ Lấy token gửi backend
          const idToken = await googleResult.user.getIdToken(true);

          const apiResult = await dispatch(loginGithubApi({ idToken }));
          if (loginGithubApi.fulfilled.match(apiResult)) {
            onClose();
            navigate("/redirect");
          }
        }
      } else {
        console.error("❌ GitHub login failed", err);
      }
    }
  };

  const handleResendOtp = useCallback(async () => {
    const resendContact =
      otpPurpose === "reset-password"
        ? form.phone || form.email
        : method === "email"
        ? form.email
        : form.phone;

    console.group("📨 RESEND OTP DEBUG");

    console.log("👉 otpPurpose:", otpPurpose);
    console.log("👉 method:", method);
    console.log("👉 form:", form);

    console.log("👉 resolved resendContact:", resendContact);

    if (!resendContact || !otpPurpose) {
      console.warn("❌ MISSING DATA:");
      console.log({
        resendContact,
        otpPurpose,
        reason: !resendContact ? "NO_CONTACT" : "NO_PURPOSE",
      });
      console.groupEnd();
      return false;
    }

    const payload = {
      contact: resendContact,
      purpose: otpPurpose,
    };

    console.log("📦 dispatch payload:", payload);

    const result = await dispatch(resendOtp(payload));

    console.log("📨 redux result:", result);
    console.log("📨 result type:", result.type);
    console.log("📨 result payload:", result.payload);
    console.log("📨 is fulfilled:", resendOtp.fulfilled.match(result));
    console.log("📨 is rejected:", resendOtp.rejected.match(result));

    if (resendOtp.rejected.match(result)) {
      console.error("❌ RESEND OTP FAILED:", result.payload || result.error);
    }

    if (resendOtp.fulfilled.match(result)) {
      console.log("✅ RESEND OTP SUCCESS:", result.payload);
    }

    console.groupEnd();

    return resendOtp.fulfilled.match(result);
  }, [dispatch, otpPurpose, form, method]);
  useEffect(() => {
    console.group("🧩 MODAL DATA UPDATE");

    console.log("modalData:", modalData);
    console.log("otpPurpose from modalData:", modalData?.otpPurpose);

    setOtpPurpose(modalData?.otpPurpose);

    console.groupEnd();
  }, [modalData]);

  // Hàm toggle phương thức email/phone
  const toggleMethod = useCallback(() => {
    setMethod((prevMethod) => (prevMethod === "email" ? "phone" : "email"));

    setForm((prev) => ({
      ...prev,
      email: "",
      phone: "",
    }));
  }, []);

  return {
    step,
    setStep,
    method,
    toggleMethod,
    form,
    setForm,
    loading,
    loginLoading,
    registerLoading,
    otpLoading,
    resendLoading,
    oauthLoading,

    isAuthenticated,
    handleLogin,
    handleRegister,
    handleValidateOtp,
    handleLoginGoogle,
    handleLoginGithub,
    errors,
    formError,
    handleResendOtp,
    otpPurpose,
    setOtpPurpose,
  };
};

export default useAuth;
