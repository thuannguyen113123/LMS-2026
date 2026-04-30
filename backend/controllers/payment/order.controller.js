import Order from "../../models/payment/order.model.js";
import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import { ORDER_CODES } from "../../constants/order.codes.js";
import OrderService from "../../services/order/order.services.js";
import AppError from "../../utils/AppError.js";

const getUserIdentifier = (user) => user?.email || user?.phone || "unknown";

const mapDoc = (doc) => {
  if (doc.toObject) doc = doc.toObject();
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
};

export const orderController = {
  async create(req, res) {
    try {
      const order = await OrderService.createOrder(
        req.validatedBody || req.body,
        req.user
      );

      return res.status(201).json({
        success: true,
        code: ORDER_CODES.ORDER_CREATED,
        message: "Tạo đơn hàng thành công",
        data: {
          order,
        },
      });
    } catch (err) {
      console.error("Create order error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: ORDER_CODES.ORDER_CREATE_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async createMany(req, res) {
    try {
      const result = await OrderService.bulkCreateOrders(
        req.body,
        req.user?.id
      );

      return res.status(201).json({
        success: true,
        code: ORDER_CODES.ORDER_BULK_CREATED,
        data: result,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: ORDER_CODES.ORDER_BULK_CREATE_FAILED,
        message: "Bulk create order thất bại",
      });
    }
  },

  async list(req, res) {
    try {
      const result = await OrderService.listOrdersUseCase({
        query: req.query,
        role: req.user.active_role,
        userId: req.user.id,
      });

      return res.json({
        success: true,
        code: ORDER_CODES.ORDER_LIST_SUCCESS,
        message: "Lấy danh sách đơn hàng thành công",
        orders: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("List orders error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: ORDER_CODES.ORDER_LIST_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async myOrders(req, res) {
    try {
      const result = await OrderService.listMyOrdersForStudent({
        userId: req.user.id,
        query: req.query,
      });

      return res.json({
        success: true,
        code: ORDER_CODES.ORDER_LIST_SUCCESS,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Không thể lấy danh sách đơn hàng",
      });
    }
  },

  async detail(req, res) {
    try {
      const order = await Order.findOne({
        _id: req.params.id,
        userId: req.user.id,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn hàng",
        });
      }

      return res.json({
        success: true,
        message: "Lấy chi tiết đơn hàng thành công",
        order: mapDoc(order),
      });
    } catch (err) {
      console.error("Get order detail error:", err);
      return res.status(500).json({
        success: false,
        message: "Không thể lấy chi tiết đơn hàng",
      });
    }
  },

  async update(req, res) {
    try {
      const order = await OrderService.updateOrderUseCase({
        id: req.params.id,
        payload: req.body,
        actor: req.user,
      });

      return res.json({
        success: true,
        code: ORDER_CODES.ORDER_UPDATED,
        message: "Cập nhật đơn hàng thành công",
        order,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      console.error("Update order error:", err);

      return res.status(500).json({
        success: false,
        code: ORDER_CODES.ORDER_UPDATE_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async cancel(req, res) {
    try {
      const order = await Order.findOne({
        _id: req.params.id,
        userId: req.user.id,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn hàng để hủy",
        });
      }

      if (order.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Đơn hàng đã được thanh toán hoặc đã hủy trước đó",
        });
      }

      const oldData = { ...order.toObject() };
      order.status = "cancelled";
      await order.save();

      await saveAuditLogs({
        entityType: "orders",
        entityId: order._id,
        action: "cancel",
        oldData,
        newData: order,
        updatedBy: getUserIdentifier(req.user),
      });

      return res.json({
        success: true,
        message: "Đã hủy đơn hàng thành công",
        order: mapDoc(order),
      });
    } catch (err) {
      console.error("Cancel order error:", err);
      return res.status(500).json({
        success: false,
        message: "Không thể hủy đơn hàng",
      });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;

      const oldData = await Order.findById(id);
      if (!oldData) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn hàng để xoá",
        });
      }

      await Order.findByIdAndDelete(id);

      await saveAuditLogs({
        entityType: "orders",
        entityId: id,
        action: "delete",
        oldData,
        newData: {},
        updatedBy: getUserIdentifier(req.user),
      });

      return res.json({
        success: true,
        message: "Xoá đơn hàng thành công",
      });
    } catch (err) {
      console.error("Remove order error:", err);
      return res.status(500).json({
        success: false,
        message: "Không thể xoá đơn hàng",
      });
    }
  },

  async removeMany(req, res) {
    try {
      const result = await OrderService.removeManyOrders(
        req.body.ids,
        req.user
      );

      return res.json({
        success: true,
        code: ORDER_CODES.ORDER_DELETE_SUCCESS,
        message: "Xóa đơn hàng thành công",
        data: result,
      });
    } catch (err) {
      console.error("Remove many orders error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: ORDER_CODES.ORDER_DELETE_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async previewExportOrders(req, res) {
    try {
      const result = await OrderService.previewExportOrders({
        payload: req.body,
      });
      return res.json({
        success: true,
        code: ORDER_CODES.ORDER_EXPORT_PREVIEW_SUCCESS,
        data: result,
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || ORDER_CODES.ORDER_EXPORT_FAILED,
        message: err.message,
      });
    }
  },
  async exportOrders(req, res) {
    try {
      const result = await OrderService.exportOrders({
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
        code: err.code || ORDER_CODES.ORDER_EXPORT_FAILED,
        message: err.message,
      });
    }
  },
};
