import UserNotificationService from "../../services/userNotification/userNotification.service.js";

export const userNotificationController = {
  async fetchMyChatNotifications(req, res) {
    try {
      const userId = req.user.id;
      const data = await UserNotificationService.getChatUserNotifications(
        userId
      );

      return res.json({
        success: true,
        notifications: data,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  },
};
