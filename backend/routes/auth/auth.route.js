import express from "express";
import { authController } from "../../controllers/auth/auth.controller.js";
import { validateRegister } from "../../validators/auth/validateRegister.js";
import {
  attachPermissions,
  authenticate,
  verifyFirebaseToken,
} from "../../middlewares/auth.js";

const router = express.Router();

//Đăng ký
router.post("/register", validateRegister, authController.register);
//xác minh OTP
router.post("/validate-otp", authController.verifyOtp);
//Đăng nhập
router.post("/login", authController.login);
router.post("/google", verifyFirebaseToken, authController.loginGoogle);
router.post("/github", verifyFirebaseToken, authController.loginGithub);
//Gửi lại mã OTP
router.post("/resend-otp", authController.resendOtp);
//SetPass
router.post("/set-password", authController.setPassword);
//set pass khi bằng phone
router.post("/verify-set-password-otp", authController.verifySetPasswordOtp);
// Forgot password
router.post("/forgot-password", authController.forgotPassword);
// Reset password
router.post("/reset-password", authController.resetPassword);
router.post("/verify-reset-otp", authController.verifyResetOtp);
router.get("/me", authenticate, authController.me);
//Logout
router.post("/logout", authController.logout);

router.post(
  "/switchRole",
  authenticate,
  attachPermissions,
  authController.switchRole
);

export default router;
