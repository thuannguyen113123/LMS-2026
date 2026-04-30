import express from "express";

import { quizController } from "../../controllers/quiz/quiz.controller.js";
import {
  authenticate,
  authorize,
  authorizePermission,
  noCompression,
  ROLES,
} from "../../middlewares/auth.js";
import {
  quizBulkSchema,
  quizSchema,
} from "../../validators/quiz/quiz.validator.js";
import validateRequest from "../../middlewares/validateRequest.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize(ROLES.STUDENT, ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("quizzes.read"),
  quizController.list
);

router.get(
  "/public",
  authorize(ROLES.STUDENT, ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("quizzes.read"),
  quizController.listPublic
);
router.get(
  "/my",
  authorize(ROLES.STUDENT),
  authorizePermission("quizzes.read"),
  quizController.myQuizzes
);
router.get("/options", quizController.options);
// Xem chi tiết quiz theo slug (student)
router.get(
  "/slug/:slug",
  authorize(ROLES.STUDENT),
  authorizePermission("quizzes.read"),
  quizController.detailBySlug
);

// Xem chi tiết quiz theo ID (quản lý)
router.get(
  "/id/:id",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("quizzes.read"),
  quizController.detailById
);

// Tạo quiz mới
router.post(
  "/createQuizz",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("quizzes.create"),
  validateRequest(quizSchema),
  quizController.create
);

// Tạo nhiều quiz cùng lúc
router.post(
  "/bulk",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("quizzes.create"),
  validateRequest(quizBulkSchema),
  quizController.createMany
);

// Cập nhật quiz
router.put(
  "/:id",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("quizzes.update"),
  validateRequest(quizSchema),
  quizController.update
);

// Xóa một quiz
router.delete(
  "/:id",
  authorizePermission("quizzes.delete"),
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  quizController.remove
);

// Xóa nhiều quiz
router.post(
  "/delete-many",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("quizzes.delete"),
  quizController.removeMany
);

router.post(
  "/export/preview",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("quizzes.export"),
  quizController.previewExportQuizzes
);

router.post(
  "/export",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("quizzes.export"),
  noCompression,
  quizController.exportQuizzes
);

export default router;
