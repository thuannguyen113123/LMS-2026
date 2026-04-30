import express from "express";
import { userNotificationController } from "../../controllers/chat/userNotification.controller.js";
import { authenticate } from "../../middlewares/auth.js";

const router = express.Router();
router.use(authenticate);

router.get("/", userNotificationController.fetchMyChatNotifications);

export default router;
