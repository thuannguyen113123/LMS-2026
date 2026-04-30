import express from "express";

import {
  authenticate,
  authorize,
  authorizePermission,
  noCompression,
  ROLES,
} from "../../middlewares/auth.js";
import { lessonController } from "../../controllers/lesson/lesson.controller.js";
import {
  lessonArraySchema,
  lessonSchema,
  updateLessonSchema,
} from "../../validators/lesson/lesson.validator.js";
import validateRequest from "../../middlewares/validateRequest.js";

const router = express.Router();

router.get("/public", lessonController.listPublic);

router.use(authenticate);

router.get(
  "/",
  authorizePermission("lessons.read"),
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.STUDENT),
  lessonController.list
);
// Tạo bài học
router.post(
  "/createLesson",
  authorizePermission("lessons.create"),
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validateRequest(lessonSchema),

  lessonController.create
);

// Tạo nhiều bài học
router.post(
  "/bulk",
  authorizePermission("lessons.create"),

  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validateRequest(lessonArraySchema),
  lessonController.createMany
);

router.get("/my-lessons", lessonController.listForUser);

// Danh sách bài học theo course
// router.get("/course/:courseId",  lessonController.listByCourse);

// Chi tiết bài học theo slug
router.get("/detail/:slug", lessonController.detail);

// Cập nhật bài học
router.put(
  "/:id",
  authorizePermission("lessons.update"),

  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validateRequest(updateLessonSchema),
  lessonController.update
);

// Xóa 1 bài học

router.delete(
  "/:id",
  authorizePermission("lessons.delete"),
  lessonController.remove
);

// Xóa nhiều bài học
router.post(
  "/delete-many",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("lessons.delete"),
  lessonController.removeMany
);

router.post(
  "/export/preview",

  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("lessons.export"),

  lessonController.previewExportLessons
);

router.post(
  "/export",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("lessons.export"),

  noCompression,
  lessonController.exportLessons
);

export default router;
