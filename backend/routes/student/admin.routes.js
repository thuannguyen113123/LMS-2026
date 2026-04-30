import express from "express";
import {
  authenticate,
  authorize,
  noCompression,
  ROLES,
} from "../../middlewares/auth.js";
import { studentController } from "../../controllers/student/student.controller.js";
import validateRequest from "../../middlewares/validateRequest.js";
import {
  studentBulkSchema,
  studentSchema,
} from "../../validators/student/student.validator.js";
import { studentBookmarkController } from "../../controllers/student/student.bookmark.controller.js";

const router = express.Router();
router.use(authenticate);
router.use(authorize(ROLES.ADMIN, ROLES.SUPERADMIN));

router.get("/", studentController.list);
router.get("/:id", studentController.detail);

router.post("/", validateRequest(studentSchema), studentController.create);
router.post(
  "/bulk",
  validateRequest(studentBulkSchema),
  studentController.createMany
);

router.put("/:id", studentController.update);

router.delete("/:id", studentController.remove);
router.post("/delete-many", studentController.removeMany);

router.post("/export/preview", studentController.previewExportStudents);

router.post("/export", noCompression, studentController.exportStudents);

export default router;
