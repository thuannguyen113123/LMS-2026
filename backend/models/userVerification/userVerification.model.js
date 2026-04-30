import mongoose from "mongoose";

const userVerificationSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  contact: { type: String },
  type: { type: String, required: true },
  expiry: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("UserVerification", userVerificationSchema);
