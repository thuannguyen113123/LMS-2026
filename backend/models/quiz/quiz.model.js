import mongoose from "mongoose";
import slugify from "slugify";

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true, index: true },
    scope: {
      type: String,
      enum: ["course", "lesson"],
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ["quiz", "exam", "practice"],
      default: "quiz",
      lowercase: true,
      index: true,
    },
    timeLimit: { type: Number, default: null },
    passingScore: { type: Number, default: 0 },
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    maxAttempts: { type: Number, default: 1 },
    isPublished: { type: Boolean, default: false, index: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);
quizSchema.pre("validate", function (next) {
  if (this.scope === "lesson" && !this.lesson) {
    return next(new Error("Lesson quiz must have lessonId"));
  }
  if (this.scope === "course" && this.lesson) {
    return next(new Error("Course quiz cannot have lessonId"));
  }
  next();
});

quizSchema.pre("save", async function (next) {
  if (this.isModified("title") || !this.slug) {
    let baseSlug = slugify(this.title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    const Quiz = mongoose.model("Quiz");
    while (await Quiz.exists({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  }
  next();
});

// --- Tạo slug khi insertMany ---
quizSchema.pre("insertMany", function (next, docs) {
  const Quiz = mongoose.model("Quiz");

  const generateSlugs = async () => {
    for (const doc of docs) {
      if (doc.title && !doc.slug) {
        let baseSlug = slugify(doc.title, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 1;

        while (await Quiz.exists({ slug })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        doc.slug = slug;
      }
    }
  };

  generateSlugs()
    .then(() => next())
    .catch(next);
});

export default mongoose.model("Quiz", quizSchema);
