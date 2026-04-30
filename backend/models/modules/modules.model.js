import mongoose from "mongoose";
import slugify from "slugify";

const moduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    icon: {
      type: String,
      default: "",
    },
    path: {
      type: String,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSystemModule: {
      type: Boolean,
      default: false,
    },
    visibility: {
      type: String,
      enum: ["admin", "public", "instructor", "both"],
      default: "admin",
      index: true,
    },
    group: {
      type: String,
      enum: ["main", "management", "others"],
      default: "main",
      index: true,
    },

    requiredPermissions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

moduleSchema.pre("save", function (next) {
  if (this.isModified("code") || !this.slug) {
    this.slug = slugify(this.code, { lower: true, strict: true });
  }
  next();
});

moduleSchema.pre("insertMany", function (next, docs) {
  for (const doc of docs) {
    if (doc.code && !doc.slug) {
      doc.slug = slugify(doc.code, { lower: true, strict: true });
    }
  }
  next();
});

export default mongoose.model("Module", moduleSchema);
