import mongoose from "mongoose";
const studentAnswerSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    selectedOptions: [{ type: String }],
    submittedAt: { type: Date, default: Date.now },
    isCorrect: { type: Boolean, default: false },
    autoGraded: { type: Boolean, default: false },
    aiFeedback: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("StudentAnswer", studentAnswerSchema);
