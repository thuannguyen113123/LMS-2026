import express from "express";

import {
  authenticate,
  authorize,
  authorizePermission,
  ROLES,
} from "../../middlewares/auth.js";
import { paymentController } from "../../controllers/payment/payment.controller.js";

const router = express.Router();
router.post(
  "/webhook",
  express.urlencoded({ extended: false }),
  paymentController.webhook
);

router.use(authenticate);
/**
 * ===========================
 *  PAYMENTS ROUTES (Braintree)
 * ===========================
 *
 *  Base path: /api/payments
 */

router.get(
  "/client-token",

  paymentController.generateClientToken
);

router.post(
  "/checkout",

  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.STUDENT),
  authorizePermission("payments.create"),

  paymentController.checkout
);

router.post(
  "/refund",
  authorize(ROLES.ADMIN),

  authorizePermission("payments.update"),

  paymentController.refund
);

router.get(
  "/",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.STUDENT),

  authorizePermission("payments.read"),

  paymentController.list
);

router.get(
  "/admin/summary",
  authorize(ROLES.ADMIN),

  authorizePermission("payments.read"),

  paymentController.summary
);
router.get(
  "/:id",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.STUDENT),

  authorizePermission("payments.read"),

  paymentController.detail
);

router.delete(
  "/:id",
  authorize(ROLES.ADMIN),

  authorizePermission("payments.delete"),

  paymentController.remove
);

router.post(
  "/delete-many",
  authorize(ROLES.ADMIN),

  authorizePermission("payments.delete"),

  paymentController.removeMany
);

router.post(
  "/export/preview",
  authorize(ROLES.ADMIN),
  authorizePermission("payments.export"),

  paymentController.previewExportPayments
);

router.post(
  "/export",
  authorize(ROLES.ADMIN),
  authorizePermission("payments.export"),
  paymentController.exportPayments
);

export default router;
