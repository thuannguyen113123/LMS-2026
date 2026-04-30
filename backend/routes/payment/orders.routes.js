import express from "express";
import {
  authenticate,
  authorize,
  authorizePermission,
  ROLES,
} from "../../middlewares/auth.js";
import { orderController } from "../../controllers/payment/order.controller.js";
import validateRequest from "../../middlewares/validateRequest.js";
import {
  createOrderSchema,
  orderBulkSchema,
} from "../../validators/payment/order.validator.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  authorize(ROLES.STUDENT, ROLES.ADMIN, ROLES.INSTRUCTOR),
  authorizePermission("orders.create"),
  validateRequest(createOrderSchema),
  orderController.create
); // tạo đơn hàng
router.post(
  "/bulk",
  authorize(ROLES.ADMIN),
  authorizePermission("orders.create"),
  validateRequest(orderBulkSchema),
  orderController.createMany
);
router.get(
  "/",
  authorize(ROLES.STUDENT, ROLES.ADMIN, ROLES.INSTRUCTOR),
  authorizePermission("orders.read"),

  orderController.list
);
router.get("/my-orders", authorize(ROLES.STUDENT), orderController.myOrders);
router.put(
  "/:id",
  authorizePermission("orders.update"),
  orderController.update
);

router.get(
  "/:id",
  authorizePermission("orders.read"),

  orderController.detail
); // chi tiết đơn hàng
router.put(
  "/:id/cancel",
  authorizePermission("orders.update"),

  orderController.cancel
); // hủy đơn
router.delete(
  "/:id",
  authorizePermission("orders.delete"),
  orderController.remove
); // xóa đơn (admin)
router.post(
  "/delete-many",
  authorize(ROLES.STUDENT, ROLES.ADMIN, ROLES.INSTRUCTOR),
  authorizePermission("orders.delete"),
  orderController.removeMany
);
router.post(
  "/export/preview",
  authorize(ROLES.ADMIN),
  authorizePermission("orders.export"),

  orderController.previewExportOrders
);

router.post(
  "/export",
  authorizePermission("orders.export"),

  authorize(ROLES.ADMIN),
  orderController.exportOrders
);
export default router;
