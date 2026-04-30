import gateway from "../../configs/braintree.js";
import { PAYMENT_CODES } from "../../constants/payment.codes.js";
import Payment from "../../models/payment/payment.model.js";
import Discount from "../../models/payment/discount.model.js";
import Order from "../../models/payment/order.model.js";
import NotificationService from "../../services/notification/notification.service.js";
import EnrollmentService from "../../services/course/enrollment.service.js";

import Course from "../../models/courses/Course.js";

import AppError from "../../utils/AppError.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import mongoose from "mongoose";
import { exportPaymentsFile, mapPaymentExportData } from "./payment.export.js";

export const mapPayment = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();

  return {
    id: doc._id?.toString(),

    user: doc.userId
      ? {
          id: doc.userId._id?.toString(),
          fullname: doc.userId.fullname,
          email: doc.userId.email,
        }
      : null,

    order: doc.orderId
      ? {
          id: doc.orderId._id?.toString(),
          status: doc.orderId.status,
          finalAmount: doc.orderId.finalAmount,
        }
      : null,

    paymentNumber: doc.paymentNumber,

    status: doc.status,

    transaction: doc.transactions?.length
      ? {
          gateway: doc.transactions[0].gateway,
          transactionId: doc.transactions[0].transactionId,
          status: doc.transactions[0].status,
          amount: doc.transactions[0].amount,
          currency: doc.transactions[0].currency,
          paymentMethod: doc.transactions[0].paymentMethod,
          responseData: doc.transactions[0].responseData,
          createdAt: doc.transactions[0].createdAt,
        }
      : null,

    notes: doc.notes,
    metadata: doc.metadata,

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};
function mapPaymentByRole(doc, role) {
  const mapped = mapPayment(doc);

  if (role === "instructor") {
    if (mapped.transaction?.transactionId) {
      mapped.transaction.transactionId =
        mapped.transaction.transactionId.slice(0, 6) + "****";
    }
  }

  return mapped;
}
export async function buildPaymentFilter({ query, role, userId }) {
  const filter = {};

  // ===== ROLE FILTER =====

  if (role === "student") {
    filter.userId = new mongoose.Types.ObjectId(userId);
  }

  if (role === "instructor") {
    const instructorDoc = await Instructor.findOne({ user: userId }).lean();

    if (!instructorDoc) {
      filter._id = null;
      return filter;
    }

    // Lấy order chứa course của instructor
    const courseIds = await Course.find({ instructor: instructorDoc._id })
      .select("_id")
      .lean();

    const orderIds = await Order.find({
      "items.itemId": { $in: courseIds.map((c) => c._id) },
    })
      .select("_id")
      .lean();

    filter.orderId = { $in: orderIds.map((o) => o._id) };
  }

  // ===== STATUS =====
  if (query.status && query.status !== "all") {
    filter.status = query.status;
  }

  // ===== SEARCH =====
  if (query.search?.trim()) {
    filter.$or = [
      { paymentNumber: { $regex: query.search, $options: "i" } },
      { notes: { $regex: query.search, $options: "i" } },
    ];
  }

  return filter;
}
export function buildPaymentSort(sort) {
  switch (sort) {
    case "amount_desc":
      return { "transaction.amount": -1, _id: -1 };
    case "amount_asc":
      return { "transaction.amount": 1, _id: 1 };
    case "oldest":
      return { createdAt: 1, _id: 1 };
    default:
      return { createdAt: -1, _id: -1 };
  }
}
export const validatePaymentExportScope = ({ scope, selectedIds }) => {
  if (!["ALL", "SELECTED", "CURRENT_PAGE"].includes(scope)) {
    throw new AppError(
      PAYMENT_CODES.PAYMENT_EXPORT_SCOPE_INVALID,
      "Phạm vi export không hợp lệ",
      400
    );
  }

  if (scope === "SELECTED" && (!selectedIds || selectedIds.length === 0)) {
    throw new AppError(
      PAYMENT_CODES.PAYMENT_EXPORT_SELECTED_EMPTY,
      "Chưa chọn thanh toán để export",
      400
    );
  }
};

export const validatePaymentExportFormat = (format) => {
  if (!["excel", "pdf"].includes(format)) {
    throw new AppError(
      PAYMENT_CODES.PAYMENT_EXPORT_FORMAT_INVALID,
      "Định dạng export không hợp lệ",
      400
    );
  }
};
const PaymentService = {
  /**
   * ========== CREATE PAYMENT ==========
   * Tạo order thanh toán (khi user bắt đầu thanh toán)
   */
  async createPayment(data) {
    const created = await Payment.create(data);
    return created.toObject();
  },

  async generateClientToken(userId) {
    try {
      if (!userId) {
        throw new AppError(
          PAYMENT_CODES.PAYMENT_CLIENT_TOKEN_FAILED,
          "Không xác định được người dùng",
          401
        );
      }

      const response = await gateway.clientToken.generate({});

      return response.clientToken;
    } catch (err) {
      if (err instanceof AppError) throw err;

      console.error("GenerateClientToken service error:", err);

      throw new AppError(
        PAYMENT_CODES.PAYMENT_CLIENT_TOKEN_FAILED,
        "Không tạo được client token",
        500
      );
    }
  },
  async checkout({ orderId, nonce, user }) {
    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      const session = await mongoose.startSession();

      try {
        session.startTransaction();

        if (!user?.id) {
          throw new AppError(
            PAYMENT_CODES.PAYMENT_UNAUTHORIZED,
            "User không hợp lệ",
            401
          );
        }

        // 1️⃣ Load Order
        let order = await Order.findById(orderId).session(session);
        if (!order)
          throw new AppError(
            PAYMENT_CODES.PAYMENT_ORDER_NOT_FOUND,
            "Không tìm thấy đơn hàng",
            404
          );
        if (order.userId.toString() !== user.id.toString())
          throw new AppError(
            PAYMENT_CODES.PAYMENT_UNAUTHORIZED,
            "Không có quyền thanh toán đơn hàng này",
            403
          );
        if (order.status !== "pending")
          throw new AppError(
            PAYMENT_CODES.PAYMENT_INVALID_STATUS,
            "Đơn hàng không hợp lệ",
            400
          );

        // 2️⃣ Atomic lock order
        order = await Order.findOneAndUpdate(
          { _id: orderId, status: "pending" },
          { $set: { status: "processing" } },
          { new: true, session }
        );
        if (!order)
          throw new AppError(
            PAYMENT_CODES.PAYMENT_INVALID_STATUS,
            "Order đã bị xử lý trước đó",
            400
          );

        // 3️⃣ Lock Discount
        if (order.discount?.code) {
          const result = await Discount.updateOne(
            {
              code: order.discount.code,
              isActive: true,
              $expr: {
                $or: [
                  { $eq: ["$usageLimit", 0] },
                  { $lt: ["$usedCount", "$usageLimit"] },
                ],
              },
            },
            { $inc: { usedCount: 1 } },
            { session }
          );

          if (result.modifiedCount === 0)
            throw new AppError(
              PAYMENT_CODES.PAYMENT_DISCOUNT_EXHAUSTED,
              "Mã giảm giá đã hết lượt",
              400
            );
        }

        await session.commitTransaction();
        session.endSession();

        // 4️⃣ Handle free payment
        if (order.finalAmount <= 0) {
          return await handleFreePayment(order, user);
        }

        // 5️⃣ Process Braintree transaction
        const saleResult = await gateway.transaction.sale({
          amount: order.finalAmount.toFixed(2),
          paymentMethodNonce: nonce,
          options: { submitForSettlement: true },
        });

        if (!saleResult.success)
          throw new AppError(
            PAYMENT_CODES.PAYMENT_FAILED,
            saleResult.message,
            400
          );

        const tx = saleResult.transaction;
        let paymentStatus = "failed";
        let orderStatus = "failed";

        if (
          [
            "submitted_for_settlement",
            "settled",
            "settlement_pending",
          ].includes(tx.status)
        ) {
          paymentStatus = "paid";
          orderStatus = "paid";
        } else if (tx.status === "authorized") {
          paymentStatus = "pending_payment";
          orderStatus = "pending_payment";
        }

        // 6️⃣ Final transaction session
        const finalSession = await mongoose.startSession();
        finalSession.startTransaction();

        const payment = await Payment.create(
          [
            {
              userId: user.id,
              orderId: order._id,
              status: paymentStatus,
              transactions: [
                {
                  gateway: "braintree",
                  transactionId: tx.id,
                  amount: tx.amount,
                  currency: tx.currencyIsoCode,
                  status: paymentStatus,
                  responseData: tx,
                },
              ],
            },
          ],
          { session: finalSession }
        );

        await Order.updateOne(
          { _id: order._id },
          { status: orderStatus, paymentId: payment[0]._id },
          { session: finalSession }
        );

        let purchasedCourses = [];

        if (orderStatus === "paid") {
          // 7️⃣ Enroll student for each purchased course
          for (const item of order.items) {
            if (item.itemType === "course") {
              const enrollResult =
                await EnrollmentService.enrollStudentToCourse({
                  userId: user.id,
                  courseId: item.itemId,
                  source: "payment",
                });
              purchasedCourses.push(item.itemId);
            }
          }

          // 8️⃣ Notify student about purchased courses
          const courses = await Course.find({
            _id: { $in: purchasedCourses },
          }).select("title");
          await Promise.all(
            courses.map((course) =>
              NotificationService.send({
                userId: user.id,
                type: "COURSE_PURCHASED",
                title: "Mua khóa học thành công",
                message: `Bạn đã mua ${course.title}`,
                meta: { courseId: course._id },
              })
            )
          );
        }

        await finalSession.commitTransaction();
        finalSession.endSession();

        return { success: true, payment: mapPayment(payment[0]) };
      } catch (err) {
        await session.abortTransaction().catch(() => {});
        session.endSession();

        if (
          err?.errorLabelSet?.has("TransientTransactionError") &&
          attempt < MAX_RETRIES - 1
        ) {
          attempt++;
          continue;
        }

        throw err;
      }
    }
  },

  /**
   * ========== REFUND TRANSACTION ==========
   * Hoàn tiền giao dịch qua Braintree
   */
  async refundTransaction(transactionId) {
    const result = await gateway.transaction.refund(transactionId);
    if (!result.success) {
      throw new Error(result.message || "Hoàn tiền thất bại");
    }

    // Cập nhật trạng thái trong DB
    const payment = await Payment.findOneAndUpdate(
      { "transaction.transactionId": transactionId },
      {
        status: "refunded",
        "transaction.status": "refunded",
        "transaction.responseData.refundInfo": result.transaction,
      },
      { new: true }
    );

    return payment?.toObject() || result;
  },

  /**
   * ========== GET ALL PAYMENTS ==========
   */

  async listPaymentsUseCase(input) {
    const { query, role, userId } = input;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = await buildPaymentFilter({
      query,
      role,
      userId,
    });

    const sortOptions = buildPaymentSort(query.sort);

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("userId", "fullname email")
        .populate({
          path: "orderId",
          select: "items finalAmount status",
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),

      Payment.countDocuments(filter),
    ]);

    return {
      data: payments.map((doc) => mapPaymentByRole(doc, role)),

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },

  /**
   * ========== GET PAYMENT BY ID ==========
   */
  async getPaymentById(id) {
    const payment = await Payment.findById(id)
      .populate("userId", "fullname email avatar")
      .lean();
    return payment;
  },

  /**
   * ========== GET PAYMENT BY ORDER NUMBER ==========
   */
  async getPaymentByOrderNumber(orderNumber) {
    return await Payment.findOne({ orderNumber }).lean();
  },

  /**
   * ========== UPDATE PAYMENT ==========
   */
  async updatePayment(id, data) {
    await Payment.findByIdAndUpdate(id, data, { new: true });
    return true;
  },

  /**
   * ========== UPDATE STATUS (webhook) ==========
   */
  async updateStatus(paymentNumber, newStatus) {
    await Payment.findOneAndUpdate(
      { paymentNumber },
      { status: newStatus, updatedAt: Date.now() },
      { new: true }
    );
    return true;
  },

  /**
   * ========== APPLY DISCOUNT ==========
   * Áp dụng giảm giá từ coupon (theo phần trăm hoặc giá cố định)
   */
  async applyDiscount(subtotal, discount) {
    if (!discount) return { discountAmount: 0, total: subtotal };

    let discountAmount = 0;

    if (discount.discountType === "percentage") {
      discountAmount = (subtotal * discount.amount) / 100;
      if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
        discountAmount = discount.maxDiscount;
      }
    } else if (discount.discountType === "fixed") {
      discountAmount = discount.amount;
    }

    const total = Math.max(subtotal - discountAmount, 0);
    return { discountAmount, total };
  },

  /**
   * ========== RECORD TRANSACTION ==========
   */
  async recordTransaction(orderNumber, transactionData) {
    const payment = await Payment.findOne({ orderNumber });
    if (!payment) throw new Error("Order not found");

    payment.transaction = transactionData;
    payment.status =
      transactionData.status === "captured" ? "paid" : transactionData.status;
    payment.updatedAt = Date.now();

    await payment.save();
    return payment.toObject();
  },

  /**
   * ========== REFUND PAYMENT ==========
   */
  async refundPayment(orderNumber, refundInfo = {}) {
    const payment = await Payment.findOne({ orderNumber });
    if (!payment) throw new Error("Order not found");

    payment.status = "refunded";
    payment.transaction.status = "refunded";
    payment.transaction.responseData = {
      ...payment.transaction.responseData,
      refundInfo,
    };
    payment.updatedAt = Date.now();

    await payment.save();
    return payment.toObject();
  },

  /**
   * ========== DELETE PAYMENT ==========
   */
  async deletePayment(id) {
    await Payment.findByIdAndDelete(id);
    return true;
  },

  /**
   * ========== DELETE MULTIPLE ==========
   */
  async removeManyPayments(ids = [], actor) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError(
        PAYMENT_CODES.PAYMENT_DELETE_EMPTY_IDS,
        "Không có thanh toán để xóa",
        400
      );
    }

    const payments = await Payment.find({
      _id: { $in: ids },
    })
      .populate("userId", "fullname email avatar")
      .lean();

    if (payments.length !== ids.length) {
      const foundIds = payments.map((p) => p._id.toString());
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      throw new AppError(
        PAYMENT_CODES.PAYMENT_NOT_FOUND,
        `Không tìm thấy thanh toán: ${notFoundIds.join(", ")}`,
        404
      );
    }

    const mappedOld = payments.map(mapPayment);

    await Payment.deleteMany({
      _id: { $in: ids },
    });

    await Promise.all(
      payments.map((payment, index) =>
        saveAuditLogs({
          entityType: "payments",
          entityId: payment._id,
          action: "delete",
          oldData: mappedOld[index],
          newData: {},
          updatedBy: actor?.id || actor?._id,
        })
      )
    );

    return {
      deletedIds: ids,
      deletedCount: ids.length,
    };
  },

  /**
   * ========== DASHBOARD SUMMARY ==========
   * Tổng hợp thống kê doanh thu cho admin
   */
  async getSummary({ startDate, endDate }) {
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const summary = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$transaction.amount" },
        },
      },
    ]);

    return summary;
  },
  async getPaymentsForExport({ scope, selectedIds, filters }) {
    const query = {};

    if (filters?.search) {
      query.paymentNumber = { $regex: filters.search, $options: "i" };
    }

    if (filters?.status?.length > 0) {
      query.status = { $in: filters.status };
    }

    if (filters?.gateway) {
      query["transaction.gateway"] = filters.gateway;
    }

    if (scope === "SELECTED") {
      query._id = { $in: selectedIds };
    }

    return Payment.find(query)
      .populate("userId", "fullname email")
      .populate("orderId", "orderNumber totalAmount")
      .sort({ createdAt: -1 })
      .lean();
  },
  async previewExportPayments({ payload }) {
    const { scope, selectedIds = [], filters = {} } = payload;

    validatePaymentExportScope({ scope, selectedIds });

    const payments = await this.getPaymentsForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!payments.length) {
      throw new AppError(
        PAYMENT_CODES.PAYMENT_EXPORT_EMPTY,
        "Không có dữ liệu để xem trước",
        404
      );
    }

    const mapped = mapPaymentExportData(payments);

    return {
      total: mapped.length,
      columns: Object.keys(mapped[0]),
      preview: mapped.slice(0, 10),
    };
  },
  async exportPayments({ payload, user }) {
    const { scope, selectedIds, filters, format } = payload;

    validatePaymentExportScope({ scope, selectedIds });
    validatePaymentExportFormat(format);

    const payments = await this.getPaymentsForExport({
      scope,
      selectedIds,
      filters,
    });

    if (!payments.length) {
      throw new AppError(
        PAYMENT_CODES.PAYMENT_EXPORT_EMPTY,
        "Không có dữ liệu để export",
        404
      );
    }

    const buffer = await exportPaymentsFile({
      payments,
      format,
    });

    await saveAuditLogs({
      entityType: "payments",
      action: "export",
      entityId: null,
      oldData: {},
      newData: { count: payments.length, format },
      updatedBy: user?.id || user?._id,
    });

    return {
      buffer,
      fileName: `payments_${Date.now()}.${format === "excel" ? "xlsx" : "pdf"}`,
      contentType:
        format === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
    };
  },
};

export default PaymentService;
