import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["private", "course", "class", "teacher_student", "system"],
    required: true,
  },
  name: {
    type: String,
    required: function () {
      return this.type !== "private";
    },
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    default: null,
    required: function () {
      return this.type === "course";
    },
  },
  user_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  admins: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    avatar: {
      url: {
        type: String,
        default: null,
      },
      type: {
        type: String,
        enum: ["generated", "custom"],
        default: "generated",
      },
      color: {
        type: String,
        default: null,
      },
      updatedAt: Date,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    pinnedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    priorityLevel: {
      type: Number,
      default: 0,
    },
    bannedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
});

// Cập nhật updated_at mỗi khi lưu
chatRoomSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});
chatRoomSchema.index({ user_ids: 1 });
chatRoomSchema.pre("save", function (next) {
  if (this.type === "private") {
    this.metadata.avatar = undefined;
    this.admins = [];
  }
  next();
});

export default mongoose.model("ChatRoom", chatRoomSchema);
