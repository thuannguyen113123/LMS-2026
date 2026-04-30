import express from "express";
import { roleController } from "../../controllers/role/role.controller.js";
import {
  authenticate,
  authorize,
  authorizePermission,
  noCompression,
  ROLES,
} from "../../middlewares/auth.js";
import { roleValidator } from "../../validators/role/role.validator.js";
import validateRequest from "../../middlewares/validateRequest.js";

const router = express.Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.get("/", authorizePermission("roles.read"), roleController.list);

router.post(
  "/",
  authorizePermission("roles.create"),
  validateRequest(roleValidator),
  roleController.create
);
router.post(
  "/bulk",
  authorizePermission("roles.create"),

  roleController.createMany
);

router.put(
  "/:id",
  authorizePermission("roles.update"),

  roleController.update
);

router.post(
  "/delete-many",
  authorizePermission("roles.delete"),

  roleController.removeMany
);
router.post(
  "/export/preview",
  authorizePermission("roles.export"),

  roleController.previewExportRoles
);
router.post(
  "/export",
  authorizePermission("roles.export"),

  noCompression,
  roleController.exportRoles
);

export default router;
