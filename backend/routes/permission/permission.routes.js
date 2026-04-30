import express from "express";
import { permissionController } from "../../controllers/permission/permission.controller.js";
import {
  authenticate,
  authorize,
  authorizePermission,
  noCompression,
  ROLES,
} from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import {
  permissionSchema,
  permissionUpdateSchema,
} from "../../validators/permisson/permission.validator.js";

const router = express.Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.post(
  "/",
  validateRequest(permissionSchema),
  authorizePermission("permissions.create"),
  permissionController.create
);

router.post(
  "/bulk",
  permissionController.createMany,
  authorizePermission("permissions.create")
);

router.get(
  "/",
  permissionController.list,
  authorizePermission("permissions.read")
);

router.post(
  "/delete-many",
  authorizePermission("permissions.delete"),
  permissionController.removeMany
);

router.put(
  "/:id",
  validateRequest(permissionUpdateSchema),
  authorizePermission("permissions.update"),
  permissionController.update
);

router.post(
  "/export/preview",
  authorizePermission("permissions.export"),
  permissionController.previewExportPermissions
);

router.post(
  "/export",
  authorizePermission("permissions.export"),
  noCompression,
  permissionController.exportPermissions
);

export default router;
