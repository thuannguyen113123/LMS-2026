import { generate6DigitCode } from "../../utils/helpers.js";
import UserVerification from "../../models/userVerification/userVerification.model.js";
import { sendVerificationEmail } from "../../services/notification/emailService.js";
import { sendOtpSms } from "../../services/notification/smsService.js";

const VerificationService = {
  async createOtp(userId, { email, phone }) {
    await UserVerification.deleteMany({
      userId,
      type: "otp",
    });

    const code = generate6DigitCode();

    await UserVerification.create({
      userId,
      type: "otp",
      token: code,
      expiry: Date.now() + 5 * 60 * 1000,
    });

    if (email) await sendVerificationEmail(email, code);
    else await sendOtpSms(phone, code);
  },
};

export default VerificationService;
