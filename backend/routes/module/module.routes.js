import express from "express";

import {
  authenticate,
  authorize,
  authorizePermission,
  noCompression,
  ROLES,
} from "../../middlewares/auth.js";
import {
  createModuleSchema,
  toggleModuleSchema,
  updateModuleSchema,
} from "../../validators/module/module.validator.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { moduleController } from "../../controllers/modules/modules.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/sidebar", moduleController.getSidebarModules);
router.use(authorize(ROLES.ADMIN));

// ✅ Tạo module

router.post(
  "/",
  authorizePermission("modules.create"),
  validateRequest(createModuleSchema),
  moduleController.create
);
// ✅ Danh sách module
router.get(
  "/",
  authorize(ROLES.ADMIN),
  authorizePermission("modules.read"),

  moduleController.list
);

// ✅ Cập nhật module
router.put(
  "/:id",
  authorizePermission("modules.update"),

  validateRequest(updateModuleSchema),
  moduleController.update
);

// ✅ Bật/tắt module
router.put(
  "/toggle/:id",
  authorizePermission("modules.update"),

  validateRequest(toggleModuleSchema),
  moduleController.toggle
);

// Xóa nhiều khóa học
router.post(
  "/delete-many",
  authorizePermission("modules.delete"),

  moduleController.removeMany
);

// // ✅ Cập nhật thứ tự menu
router.put(
  "/order",
  authorizePermission("modules.update"),

  moduleController.sort
);

router.post(
  "/export/preview",
  authorizePermission("modules.export"),

  moduleController.previewExportModules
);

router.post(
  "/export",
  noCompression,
  authorizePermission("modules.export"),
  moduleController.exportModules
);

export default router;
