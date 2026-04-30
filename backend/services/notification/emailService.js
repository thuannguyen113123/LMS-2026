import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendVerificationEmail(to, code) {
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to,
    subject: "Mã xác thực - LMS",
    html: `<p>Mã xác thực OTP của bạn là: <b>${code}</b></p>`,
  };
  return transporter.sendMail(mailOptions);
}

export async function sendSetPasswordEmail(to, token) {
  const link = `${process.env.CLIENT_URL}/set-password?token=${token}`;

  return transporter.sendMail({
    from: process.env.EMAIL_USERNAME,
    to,
    subject: "Thiết lập mật khẩu",
    html: `<a href="${link}">Thiết lập mật khẩu</a>`,
  });
}

export async function sendResetPasswordEmail(to, token) {
  const link = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  return transporter.sendMail({
    from: process.env.EMAIL_USERNAME,
    to,
    subject: "Đặt lại mật khẩu",
    html: `<a href="${link}">Đặt lại mật khẩu</a>`,
  });
}
