import express from "express";
import { authenticate, authorizePermission } from "../../middlewares/auth.js";
import { instructorRequestController } from "../../controllers/instructorRequest/InstructorRequest.controller.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",

  instructorRequestController.requestUpgrade
);

router.post(
  "/:id/approve",

  instructorRequestController.approve
);

router.post("/:id/reject", instructorRequestController.reject);

export default router;
