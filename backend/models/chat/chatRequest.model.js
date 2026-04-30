import mongoose from "mongoose";

const chatRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pairKey: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    privateRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      default: null,
    },
  },
  { timestamps: true }
);
chatRequestSchema.index(
  { pairKey: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  }
);
export default mongoose.model("ChatRequest", chatRequestSchema);
