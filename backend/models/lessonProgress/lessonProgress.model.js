import mongoose from "mongoose";
import { checkAndCompleteCourse } from "../../services/course/courseCompletion.service.js";

const lessonProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
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
      required: true,
      index: true,
    },
    lessonType: {
      type: String,
      enum: ["video", "reading", "assignment"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "not_started",
        "in_progress",
        "quiz_pending",
        "failed",
        "completed",
        "locked",
      ],
      default: "not_started",
      index: true,
    },
    progress: {
      percent: { type: Number, default: 0 },
      currentTime: { type: Number, default: 0 },
      duration: { type: Number, default: 0 },
    },
    quiz: {
      hasQuiz: { type: Boolean, default: false },
      attempted: { type: Boolean, default: false },
      passed: { type: Boolean, default: false },
      score: { type: Number, default: null },
      maxScore: { type: Number, default: null },
      attempts: { type: Number, default: 0 },
      maxAttempts: { type: Number, default: 1 },
      lastSubmittedAt: { type: Date, default: null },
      lastAttemptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StudentQuizAttempt",
        default: null,
      },
    },
    lastAccessedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
lessonProgressSchema.index({ student: 1, lesson: 1 }, { unique: true });
lessonProgressSchema.index({ student: 1, course: 1 });
lessonProgressSchema.index({ course: 1, status: 1 });
lessonProgressSchema.pre("save", function (next) {
  const percent = this.progress?.percent || 0;
  const hasFinishedContent = percent >= 80;
  const isStarted = percent > 0;

  if (isStarted && percent < 100) {
    this.status = "in_progress";
  }

  if (this.quiz?.hasQuiz) {
    if (hasFinishedContent && !this.quiz.attempted) {
      this.status = "quiz_pending";
    }
    if (this.quiz.attempted) {
      this.status = this.quiz.passed ? "completed" : "failed";
    }
  }

  if (!this.quiz?.hasQuiz && percent === 100) {
    this.status = "completed";
  }
  if ((this.status === "completed" || percent === 100) && !this.completedAt) {
    this.completedAt = new Date();
  }

  next();
});
lessonProgressSchema.post("save", async function (doc) {
  if (!doc.completedAt) return;

  await checkAndCompleteCourse({
    studentId: doc.student,
    courseId: doc.course,
  });
});

export default mongoose.model("LessonProgress", lessonProgressSchema);
