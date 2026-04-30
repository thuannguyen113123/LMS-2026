import mongoose from "mongoose";

export const attachmentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["image", "file", "video", "audio", "raw"],
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
    default: null,
  },
  thumbnailUrl: {
    type: String,
    default: null,
  },
});
export const reactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reaction: {
    type: String,
    required: true,
  },
});

export const metadataSchema = new mongoose.Schema({
  edited: {
    type: Boolean,
    default: false,
  },
  deleted: {
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
});

const messageSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatRoom",
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    default: "",
  },
  attachments: {
    type: [attachmentSchema],
    default: [],
  },
  messageType: {
    type: String,
    enum: ["text", "attachment", "mixed", "system", "announcement"],
  },
  reactions: {
    type: [reactionSchema],
    default: [],
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    type: metadataSchema,
    default: () => ({}),
  },
});

// Auto cập nhật updatedAt khi lưu
messageSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});
messageSchema.index({ roomId: 1, _id: -1 });
messageSchema.index(
  { _id: 1, "reactions.userId": 1 },
  { unique: true, sparse: true }
);

export default mongoose.model("Message", messageSchema);
