import mongoose from "mongoose";
import { makeSlug } from "../../utils/slug.js";

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    description: { type: String, default: "", trim: true },
    slug: { type: String, unique: true, index: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);
CategorySchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = makeSlug(this.name);
  }
  next();
});
CategorySchema.pre("insertMany", function (next, docs) {
  docs.forEach((doc) => {
    if (!doc.slug) {
      doc.slug = makeSlug(doc.name);
    }
  });
  next();
});

export default mongoose.model("Category", CategorySchema);
