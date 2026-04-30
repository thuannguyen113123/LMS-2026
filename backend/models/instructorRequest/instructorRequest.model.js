import mongoose from "mongoose";

const instructorRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    review: {
      by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      at: {
        type: Date,
        default: null,
      },
      reason: {
        type: String,
        default: "",
        trim: true,
        maxlength: 1000,
      },
    },
    meta: {
      ip: String,
      userAgent: String,
      source: {
        type: String,
        enum: ["web", "mobile", "admin"],
        default: "web",
      },
    },
  },
  {
    timestamps: true,
  }
);

instructorRequestSchema.index(
  { user: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

export default mongoose.model("InstructorRequest", instructorRequestSchema);
