import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullname: { type: String, default: "" },
    email: {
      type: String,
      lowercase: true,
      trim: true,

      default: undefined,
    },

    phone: {
      type: String,

      default: undefined,
    },
    avatar: {
      type: String,
      default: "https://i.pravatar.cc/150?u=default-avatar",
    },
    provider: {
      type: String,
      enum: ["local", "google", "github"],
      required: true,
    },

    googleId: { type: String, index: true, default: null },
    githubId: { type: String, index: true, default: null },

    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "light",
      },
      language: {
        type: String,
        default: "vi",
      },
      notificationSettings: {
        type: Object,
        default: {},
      },
    },

    password: { type: String },

    role_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
    active_role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null,
    },
    isActive: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
    createdAt: { type: Number, default: () => Date.now() },
    lastLogin: { type: Number, default: null },
    isOnline: { type: Boolean, default: false },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $exists: true },
    },
  }
);

userSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      phone: { $exists: true },
    },
  }
);

export default mongoose.model("User", userSchema);
