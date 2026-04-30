import mongoose from "mongoose";

const userBlockSchema = new mongoose.Schema({
  blockerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  blockedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
userBlockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });
export default mongoose.model("userBlock", userBlockSchema);
