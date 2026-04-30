import { client } from "../../configs/twilio.js";
import dotenv from "dotenv";
dotenv.config();

export async function sendOtpSms(to, code) {
  return client.messages.create({
    body: `Mã xác thực OTP của bạn là: ${code}`,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    to,
  });
}
export async function sendSetPasswordSms(to, token) {
  const link = `http://localhost:5173/set-password?token=${token}`;
  const message = `Thiết lập mật khẩu tài khoản của bạn tại: ${link}`;

  return client.messages.create({
    body: message,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    to,
  });
}
