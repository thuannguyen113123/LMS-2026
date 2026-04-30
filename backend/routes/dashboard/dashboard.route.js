import express from "express";
import { dashboardController } from "../../controllers/dashboard/dashboard.controller.js";
import { authenticate, authorize, ROLES } from "../../middlewares/auth.js";

const router = express.Router();

// ONE ROUTE: GET /dashboard
router.get(
  "/",
  authenticate,
  authorize(ROLES.ADMIN, ROLES.INSTRUCTOR, ROLES.STUDENT),
  dashboardController.getDashboard
);

export default router;
