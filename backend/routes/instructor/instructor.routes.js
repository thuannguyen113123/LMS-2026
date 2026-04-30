import express from "express";
import {
  authenticate,
  authorize,
  authorizePermission,
  noCompression,
  ROLES,
} from "../../middlewares/auth.js";
import { instructorController } from "../../controllers/instructor/instructor.controller.js";
import {
  instructorBulkSchema,
  instructorSchema,
  updateInstructorSchema,
} from "../../validators/instructor/instructor.validator.js";
import validateRequest from "../../middlewares/validateRequest.js";

const router = express.Router();
router.get("/public", instructorController.list);
router.get("/filter-options", instructorController.filterOptions);

router.use(authenticate);
router.get(
  "/",
  authorizePermission("instructors.read"),
  instructorController.list
);
router.get("/options", instructorController.options);

router.use(authorize(ROLES.INSTRUCTOR, ROLES.ADMIN));

// Chi tiết theo slug
router.get(
  "/:slug",
  authorizePermission("instructors.read"),
  instructorController.detailBySlug
);

router.post(
  "/create",
  authorizePermission("instructors.create"),
  validateRequest(instructorSchema),
  instructorController.create
);

router.post(
  "/bulk",
  authorizePermission("instructors.create"),

  validateRequest(instructorBulkSchema),
  instructorController.createMany
);

router.put(
  "/:id",
  authorizePermission("instructors.update"),

  validateRequest(updateInstructorSchema),
  instructorController.update
);

router.post(
  "/delete-many",
  authorizePermission("instructors.delete"),
  instructorController.removeMany
);

router.post(
  "/export/preview",
  authorizePermission("instructors.export"),
  instructorController.previewExportInstructors
);

router.post(
  "/export",
  authorizePermission("instructors.export"),
  noCompression,
  instructorController.exportInstructors
);

export default router;
