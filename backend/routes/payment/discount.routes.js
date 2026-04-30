import express from "express";
import {
  authenticate,
  authorize,
  authorizePermission,
  noCompression,
  optionalAuthenticate,
  ROLES,
} from "../../middlewares/auth.js";
import { discountController } from "../../controllers/payment/discount.controller.js";
import {
  createDiscountSchema,
  discountBulkSchema,
  updateDiscountSchema,
} from "../../validators/payment/discount.validator.js";
import validateRequest from "../../middlewares/validateRequest.js";

const router = express.Router();

router.get("/featured", optionalAuthenticate, discountController.featured);
router.use(authenticate);
router.post(
  "/",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validateRequest(createDiscountSchema),
  authorizePermission("discounts.create"),

  discountController.create
);
router.post(
  "/bulk",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("discounts.create"),

  validateRequest(discountBulkSchema),
  discountController.createMany
);
router.post("/apply", discountController.apply);
router.get(
  "/",
  authorizePermission("discounts.read"),

  discountController.list
);
router.get(
  "/:id",
  authorizePermission("discounts.read"),

  discountController.detail
);
router.put(
  "/:id",
  authorize(ROLES.ADMIN),
  authorizePermission("discounts.update"),

  validateRequest(updateDiscountSchema),
  discountController.update
);

router.post(
  "/delete-many",

  authorize(ROLES.ADMIN, ROLES.INSTRUCTOR),
  authorizePermission("discounts.delete"),

  discountController.removeMany
);

router.post(
  "/export/preview",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("discounts.export"),

  discountController.previewExportDiscounts
);

router.post(
  "/export",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("discounts.export"),

  noCompression,
  discountController.exportDiscounts
);

export default router;
