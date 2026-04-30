import express from "express";
import { authenticate } from "../../middlewares/auth.js";
import { rolePermissionController } from "../../controllers/roleAndPermission/rolePermission.controller.js";

const router = express.Router();

// 🔹 Gán 1 permission cho 1 role
router.post("/", authenticate, rolePermissionController.assign);

// 🔹 Gán nhiều permission cho role
router.post("/bulk", authenticate, rolePermissionController.assignMany);

// 🔹 Lấy danh sách các quyền đã gán cho role (lọc + phân trang)
router.get("/", authenticate, rolePermissionController.list);

// 🔹 Cập nhật role & permissions của 1 user
router.put(
  "/:roleId",
  authenticate,
  rolePermissionController.updateRolePermissions
);
// 🔹 Lấy chi tiết vai trò và quyền của 1 user
router.get(
  "/:userId",
  authenticate,
  rolePermissionController.getUserRolePermissions
);

// 🔹 Xoá 1 gán quyền
router.delete("/:id", authenticate, rolePermissionController.remove);

// 🔹 Xoá nhiều gán quyền
router.post("/delete-many", authenticate, rolePermissionController.removeMany);

export default router;
