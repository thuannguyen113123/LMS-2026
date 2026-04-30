import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    gateway: {
      type: String,
      enum: ["braintree", "paypal", "stripe"],
      default: "braintree",
    },
    transactionId: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "initiated",
        "authorized",
        "captured",
        "failed",
        "refunded",
        "paid",
      ],
      default: "initiated",
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "VND" },
    paymentMethod: { type: String, default: "card" },
    responseData: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    transactions: [transactionSchema],
    status: {
      type: String,
      enum: [
        "initiated",
        "authorized",
        "captured",
        "failed",
        "refunded",
        "paid",
        "cancelled",
        "pending",
      ],
      default: "initiated",
    },
    paymentNumber: {
      type: String,
      unique: true,
      default: () => `PAY-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    },
    notes: { type: String, default: "" },
    metadata: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now, immutable: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
paymentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});
paymentSchema.index({ orderId: 1 }, { unique: true });
export default mongoose.model("Payment", paymentSchema);
