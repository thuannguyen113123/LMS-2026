import express from "express";

import { authenticate } from "../../middlewares/auth.js";
import { NotificationController } from "../../controllers/notifications/notification.controller.js";

const router = express.Router();

router.get("/", authenticate, NotificationController.getMyNotifications);
router.patch("/mark-read", authenticate, NotificationController.markAsRead);
router.get(
  "/notification-settings",
  authenticate,
  NotificationController.getNotificationSettings
);
router.post("/delete-many", authenticate, NotificationController.removeMany);

export default router;
