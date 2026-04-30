import AppError from "../../utils/AppError.js";
import { NOTIFICATION_CODES } from "../../constants/notification.codes.js";
import NotificationService from "../../services/notification/notification.service.js";

export const NotificationController = {
  async getNotificationSettings(req, res) {
    try {
      const role = req.user?.active_role || req.user?.roles?.[0]?.name;

      const settings = await NotificationService.getNotificationSettings(
        req.user.id,
        role
      );

      return res.json({
        success: true,
        data: settings,
      });
    } catch (err) {
      console.error("getNotificationSettings error:", err);

      return res.status(500).json({
        success: false,
        message: "Không lấy được notification settings",
      });
    }
  },

  async updateNotificationSettings(req, res) {
    try {
      const settings = await NotificationService.updateNotificationSettings(
        req.user.id,
        req.body
      );

      return res.json({
        success: true,
        code: NOTIFICATION_CODES.NOTIFICATION_SETTINGS_UPDATED,
        message: "Cập nhật notification thành công",
        data: settings,
      });
    } catch (err) {
      console.error("updateNotificationSettings error:", err);

      return res.status(500).json({
        success: false,
        message: "Không cập nhật được notification settings",
      });
    }
  },
  async getMyNotifications(req, res) {
    try {
      const result = await NotificationService.getMyNotifications(
        req.user.id,
        req.query
      );
      return res.json({
        success: true,
        code: NOTIFICATION_CODES.GET_MY_NOTIFICATIONS_SUCCESS,
        notifications: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("Get my notifications error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: NOTIFICATION_CODES.GET_MY_NOTIFICATIONS_FAILED,
        message: "Lấy danh sách notification thất bại",
      });
    }
  },

  async markAsRead(req, res) {
    try {
      const { ids } = req.body;
      if (!ids?.length) {
        throw new AppError(
          "INVALID_PAYLOAD",
          "Chưa có notification nào được chọn",
          400
        );
      }

      const result = await NotificationService.markAsRead(req.user.id, ids);

      return res.json({
        success: true,
        code: "NOTIFICATIONS_MARKED_READ",
        message: `${result.modifiedCount} notification đã đánh dấu là đã đọc`,
        data: { ids },
      });
    } catch (err) {
      console.error(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }
      return res.status(500).json({
        success: false,
        code: "NOTIFICATIONS_MARKED_READ_FAILED",
        message: "Đánh dấu đã đọc thất bại",
      });
    }
  },
  async removeMany(req, res) {
    try {
      const { ids } = req.body;

      if (!ids?.length) {
        throw new AppError(
          "NOTIFICATION_DELETE_EMPTY",
          "Chưa chọn notification nào",
          400
        );
      }

      const result = await NotificationService.removeMany(req.user.id, ids);

      return res.json({
        success: true,
        code: "NOTIFICATION_DELETE_SUCCESS",
        message: "Xóa notification thành công",
        data: result,
      });
    } catch (err) {
      console.error("Remove notifications error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: "NOTIFICATION_DELETE_FAILED",
        message: "Lỗi server",
      });
    }
  },
};
