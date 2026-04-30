import mongoose from "mongoose";
const studentQuizAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },

    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    duration: { type: Number },

    score: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["in_progress", "completed", "graded"],
      default: "in_progress",
    },

    answers: [{ type: mongoose.Schema.Types.ObjectId, ref: "StudentAnswer" }],
  },
  { timestamps: true }
);

export default mongoose.model("StudentQuizAttempt", studentQuizAttemptSchema);
