import express from "express";
import { authenticate } from "../../middlewares/auth.js";
import { auditLogController } from "../../controllers/auditLog/auditLogController.js";

const router = express.Router();

router.get("/:entityType/:entityId", authenticate, auditLogController.getLogs);
router.get(
  "/:entityType",
  authenticate,
  auditLogController.getAllLogsByEntityType
);

export default router;
