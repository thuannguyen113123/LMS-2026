import express from "express";
import { messageController } from "../../controllers/chat/message.controller.js";
import { authenticate, authorizePermission } from "../../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

// POST /chat/messages
router.post(
  "/",
  authorizePermission("messages.create"),

  messageController.sendMessage
);

// DELETE /chat/messages/:id
router.delete(
  "/:id",

  messageController.deleteMessage
);

router.get("/", messageController.listAdminMessages);

// POST /chat/messages/:id/reaction
router.post("/:id/reaction", messageController.addReaction);

export default router;
