import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        itemType: {
          type: String,
          enum: ["course", "bundle"],
          default: "course",
        },
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "items.itemType",
        },
        title: String,
        price: Number,
      },
    ],
    subtotal: { type: Number, required: true },
    discount: {
      code: { type: String },
      discountType: { type: String, enum: ["percentage", "fixed"] },
      value: { type: Number },
      discountAmount: { type: Number },
    },
    totalAmount: { type: Number, required: true },
    finalAmount: { type: Number, required: true },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
