import UserVerification from "../../models/userVerification/userVerification.model.js";

const saveVerificationToken = async ({ userId, type, token, expiry }) => {
  return await UserVerification.findOneAndUpdate(
    { userId, type }, // ✅ CHUẨN
    {
      userId,
      type,
      token,
      expiry,
      createdAt: Date.now(),
    },
    { upsert: true, new: true }
  );
};

const getVerificationToken = async (token, type) => {
  const record = await UserVerification.findOne({
    token: String(token),
    type,
  });
  if (!record) return null;

  if (record.expiry < Date.now()) {
    await UserVerification.deleteOne({ _id: record._id });
    return null;
  }

  return record;
};

const deleteVerificationToken = async (token) => {
  await UserVerification.deleteOne({ token });
};

const deleteOtpTokensByUser = async (userId) => {
  await UserVerification.deleteMany({
    userId,
    type: "otp",
  });
};
const deleteResetTokensByUser = async (userId) => {
  await UserVerification.deleteMany({
    userId,
    type: { $in: ["reset-password", "reset-password-otp"] },
  });
};
const deleteSetPasswordToken = async (userId) => {
  await UserVerification.deleteMany({
    userId,
    type: "set-password",
  });
};

export default {
  saveVerificationToken,
  getVerificationToken,
  deleteVerificationToken,
  deleteOtpTokensByUser,
  deleteResetTokensByUser,
  deleteSetPasswordToken,
};
