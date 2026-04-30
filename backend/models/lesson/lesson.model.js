import mongoose from "mongoose";
import slugify from "slugify";

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true, index: true },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    content: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    order: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
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
lessonSchema.pre("save", function (next) {
  if (this.isModified("title") || !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

lessonSchema.pre("insertMany", function (next, docs) {
  for (const [i, doc] of docs.entries()) {
    if (doc.title && !doc.slug) {
      doc.slug =
        slugify(doc.title, { lower: true, strict: true }) +
        "-" +
        Date.now() +
        "-" +
        i;
    }
  }
  next();
});

export default mongoose.model("Lesson", lessonSchema);
