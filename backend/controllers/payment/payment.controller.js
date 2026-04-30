import mongoose from "mongoose";
import PaymentService from "../../services/payment/payment.service.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import EnrollmentModel from "../../services/course/enrollment.service.js";
import gateway from "../../configs/braintree.js";
import { PAYMENT_CODES } from "../../constants/payment.codes.js";
import AppError from "../../utils/AppError.js";

const getUserIdentifier = (user) => user?.email || user?.phone || "unknown";

const mapDoc = (doc) => {
  if (doc?.toObject) doc = doc.toObject();
  const { _id, __v, ...rest } = doc;
  return { id: _id.toString(), ...rest };
};

export const paymentController = {
  async generateClientToken(req, res) {
    try {
      const token = await PaymentService.generateClientToken(
        req.user?.id || req.user?._id
      );

      return res.status(200).json({
        success: true,
        code: PAYMENT_CODES.PAYMENT_CLIENT_TOKEN_GENERATED,
        message: "Tạo client token thành công",
        data: {
          clientToken: token,
        },
      });
    } catch (err) {
      console.error("Generate client token error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: PAYMENT_CODES.PAYMENT_CLIENT_TOKEN_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async checkout(req, res) {
    try {
      const payment = await PaymentService.checkout({
        user: req.user,
        nonce: req.body.nonce,
        orderId: req.body.orderId,
      });

      return res.status(201).json({
        success: true,
        code: PAYMENT_CODES.PAYMENT_CHECKOUT_SUCCESS,
        message: "Thanh toán thành công",
        data: {
          payment,
        },
      });
    } catch (err) {
      console.error("Checkout payment error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: PAYMENT_CODES.PAYMENT_CHECKOUT_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async webhook(req, res) {
    try {
      const { bt_signature, bt_payload } = req.body;

      const webhookNotification = await gateway.webhookNotification.parse(
        bt_signature,
        bt_payload
      );

      switch (webhookNotification.kind) {
        case "disbursement": {
          const disbursement = webhookNotification.disbursement;

          await PaymentService.markDisbursed({
            disbursementId: disbursement.id,
            amount: disbursement.amount,
            transactionIds: disbursement.transactionIds,
          });

          break;
        }

        case "dispute_opened": {
          const dispute = webhookNotification.dispute;

          await PaymentService.markDisputeOpened({
            disputeId: dispute.id,
            transactionId: dispute.transaction.id,
          });

          await EnrollmentModel.lockByTransactionId(dispute.transaction.id);

          break;
        }

        case "dispute_lost": {
          const dispute = webhookNotification.dispute;

          await PaymentService.markDisputeLost({
            disputeId: dispute.id,
            transactionId: dispute.transaction.id,
          });

          await EnrollmentModel.revokeByTransactionId(dispute.transaction.id);

          break;
        }
        case "refund_failed": {
          console.log("Refund failed");
          break;
        }

        default: {
          console.log("ℹ️ Unhandled webhook:", webhookNotification.kind);
        }
      }

      return res.sendStatus(200);
    } catch (err) {
      console.error(" [PaymentController.webhook] Error:", err);
      return res.sendStatus(500);
    }
  },

  async refund(req, res) {
    try {
      const { orderNumber, refundInfo } = req.body;
      if (!orderNumber)
        return res
          .status(400)
          .json({ success: false, error: "Thiếu mã đơn hàng để hoàn tiền." });

      const refunded = await PaymentService.refundPayment(
        orderNumber,
        refundInfo
      );

      await saveAuditLogs({
        entityType: "payments",
        entityId: refunded._id,
        oldData: {},
        newData: refunded,
        updatedBy: getUserIdentifier(req.user),
      });

      return res.json({ success: true, payment: mapDoc(refunded) });
    } catch (err) {
      console.error("[PaymentController.refund] Error:", err);
      return res
        .status(500)
        .json({ success: false, error: "Không thể hoàn tiền." });
    }
  },
  async list(req, res) {
    try {
      const result = await PaymentService.listPaymentsUseCase({
        query: req.query,
        role: req.user.active_role,
        userId: req.user.id,
      });

      return res.json({
        success: true,
        code: PAYMENT_CODES.PAYMENT_LIST_SUCCESS,
        message: "Lấy danh sách thanh toán thành công",
        payments: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("List payments error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: PAYMENT_CODES.PAYMENT_LIST_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async detail(req, res) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id))
        return res
          .status(400)
          .json({ success: false, error: "ID không hợp lệ." });

      const payment = await PaymentService.getPaymentById(id);
      if (!payment)
        return res
          .status(404)
          .json({ success: false, error: "Không tìm thấy thanh toán." });

      return res.json({ success: true, payment });
    } catch (err) {
      console.error("[PaymentController.detail] Error:", err);
      return res
        .status(500)
        .json({ success: false, error: "Lỗi khi tải chi tiết thanh toán." });
    }
  },

  async summary(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const summary = await PaymentService.getSummary({ startDate, endDate });

      return res.json({ success: true, summary });
    } catch (err) {
      console.error("[PaymentController.summary] Error:", err);
      return res
        .status(500)
        .json({ success: false, error: "Không thể tải thống kê." });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      const oldData = await PaymentService.getPaymentById(id);
      if (!oldData)
        return res
          .status(404)
          .json({ success: false, error: "Không tìm thấy thanh toán để xóa." });

      await PaymentService.deletePayment(id);

      await saveAuditLogs({
        entityType: "payments",
        entityId: id,
        oldData,
        newData: {},
        updatedBy: getUserIdentifier(req.user),
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("[PaymentController.remove] Error:", err);
      return res
        .status(500)
        .json({ success: false, error: "Không thể xóa thanh toán." });
    }
  },

  async removeMany(req, res) {
    try {
      const result = await PaymentService.removeManyPayments(
        req.body.ids,
        req.user
      );

      return res.json({
        success: true,
        code: PAYMENT_CODES.PAYMENT_DELETE_SUCCESS,
        message: "Xóa thanh toán thành công",
        data: result,
      });
    } catch (err) {
      console.error("Remove many payments error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: PAYMENT_CODES.PAYMENT_DELETE_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async previewExportPayments(req, res) {
    try {
      const result = await PaymentService.previewExportPayments({
        payload: req.body,
      });

      return res.json({
        success: true,
        code: PAYMENT_CODES.PAYMENT_EXPORT_PREVIEW_SUCCESS,
        data: result,
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || PAYMENT_CODES.PAYMENT_EXPORT_FAILED,
        message: err.message,
      });
    }
  },

  async exportPayments(req, res) {
    try {
      const result = await PaymentService.exportPayments({
        payload: req.body,
        user: req.user,
      });

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.fileName}"`
      );
      res.setHeader("Content-Type", result.contentType);

      return res.send(result.buffer);
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || PAYMENT_CODES.PAYMENT_EXPORT_FAILED,
        message: err.message,
      });
    }
  },
};
