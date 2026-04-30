import mongoose from "mongoose";

const userNotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatRoom",
    required: true,
  },
  lastReadMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    default: null,
  },
  unreadCount: {
    type: Number,
    default: 0,
  },
  muted: {
    type: Boolean,
    default: false,
  },
  priorityScore: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto cập nhật updatedAt khi lưu
userNotificationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});
userNotificationSchema.index({ userId: 1, roomId: 1 }, { unique: true });

export default mongoose.model("UserNotification", userNotificationSchema);
