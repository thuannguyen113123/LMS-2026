import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number, default: 0 },
    applicableTo: {
      type: String,
      enum: ["all", "course", "bundle", "user_specific"],
      default: "all",
    },
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Có thể thêm pre hook để tự disable khi hết hạn hoặc quá usageLimit
discountSchema.pre("save", function (next) {
  if (this.usageLimit > 0 && this.usedCount >= this.usageLimit) {
    this.isActive = false;
  }
  next();
});

export default mongoose.model("Discount", discountSchema);
