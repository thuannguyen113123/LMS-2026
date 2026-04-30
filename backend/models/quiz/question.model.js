import mongoose from "mongoose";
const questionSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    type: {
      type: String,
      enum: ["multiple_choice", "true_false", "short_answer", "coding"],
      required: true,
    },
    content: { type: String, required: true },
    options: [
      {
        text: String,
        isCorrect: { type: Boolean, default: false },
        feedback: { type: String },
      },
    ],
    correctAnswers: [{ type: String }],
    explanation: { type: String },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    tags: [{ type: String }],
    points: { type: Number, default: 1 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      required: true,
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Question", questionSchema);
