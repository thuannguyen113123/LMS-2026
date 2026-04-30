import mongoose from "mongoose";
import {
  attachmentSchema,
  metadataSchema,
  reactionSchema,
} from "../chat/message.model.js";

const commentSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ["course", "lesson", "home"],
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    like_count: { type: Number, default: 0 },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    report_count: { type: Number, default: 0 },
    reportedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    attachments: [attachmentSchema],
    reactions: [reactionSchema],
    metadata: {
      type: metadataSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

/* ================= INDEX ================= */
commentSchema.index({
  targetType: 1,
  targetId: 1,
  parentId: 1,
  createdAt: -1,
});

export default mongoose.model("Comment", commentSchema);
