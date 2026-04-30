import express from "express";
import {
  authenticate,
  authorize,
  authorizePermission,
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
import { studentCertificateController } from "../../controllers/certificate/studentCertificate.controller.js";

const router = express.Router();

router.get("/public", studentController.listPublic);
router.use(authenticate);
router.use(authorize(ROLES.STUDENT, ROLES.ADMIN, ROLES.INSTRUCTOR));

router.post(
  "/create",

  authorizePermission("students.create"),
  validateRequest(studentSchema),
  studentController.create
);

router.post(
  "/bulk",
  validateRequest(studentBulkSchema),

  authorizePermission("students.create"),
  studentController.createMany
);

// 🔍 READ
router.get(
  "/",

  authorizePermission("students.read"),
  studentController.list
);

router.get(
  "/:id",

  authorizePermission("students.read"),
  studentController.detail
);

router.put(
  "/:id",

  authorizePermission("students.update"),
  studentController.update
);

// 🗑️ DELETE
router.delete(
  "/:id",

  authorizePermission("students.delete"),
  studentController.remove
);
router.post(
  "/delete-many",
  authorizePermission("students.delete"),
  studentController.removeMany
);

// 📊 STATS

router.post(
  "/export/preview",
  authorizePermission("students.export"),
  studentController.previewExportStudents
);

router.post(
  "/export",
  noCompression,

  authorizePermission("students.export"),
  studentController.exportStudents
);

router.post("/me/instructor-rating", studentController.rateInstructor);

router.delete(
  "/me/instructor-rating/:instructorId",
  studentController.removeInstructorRating
);
router.get("/me/bookmarks", studentBookmarkController.getMyBookmarks);

router.post(
  "/me/bookmarks/:courseId/toggle",
  studentBookmarkController.toggleBookmark
);

// student certificates
router.get(
  "/me/certificates",
  authorizePermission("certificates.read"),

  studentCertificateController.listAdmin
);
router.patch(
  "/certificates/:id/revoke",
  authorizePermission("certificates.delete"),

  studentCertificateController.revokeCertificate
);

// public certificates (profile)
router.get("/public/certificates", studentCertificateController.listPublic);
export default router;
