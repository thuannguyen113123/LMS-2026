import express from "express";
import { authenticate } from "../../middlewares/auth.js";
import chatRoomRoutes from "./chatRoomRoutes.js";
import messageRoutes from "./messageRoutes.js";
import chatRequestRoutes from "./chatRequestRoutes.js";
import userNotificationRoutes from "./userNotificationRoutes.js";

const router = express.Router();

// tất cả chat đều cần auth
router.use(authenticate);

router.use("/rooms", chatRoomRoutes);
// Message APIs (global)
router.use("/messages", messageRoutes);

router.use("/requests", chatRequestRoutes);
router.use("/notifications", userNotificationRoutes);

export default router;
