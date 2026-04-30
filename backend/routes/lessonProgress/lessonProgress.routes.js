import express from "express";
import { authenticate } from "../../middlewares/auth.js";
import { lessonProgressController } from "../../controllers/lessonProgress/lessonProgress.controller.js";
import validateRequest from "../../middlewares/validateRequest.js";
import {
  completeLessonSchema,
  getOrCreateSchema,
  submitQuizSchema,
  updateWatchingSchema,
} from "../../validators/lessonProgress/lessonProgress.validation.js";

const router = express.Router();

router.post(
  "/get-or-create",
  authenticate,
  validateRequest(getOrCreateSchema),
  lessonProgressController.getOrCreate
);

router.get(
  "/course/:courseId",
  authenticate,
  lessonProgressController.getByCourse
);

router.patch(
  "/watching",
  authenticate,

  validateRequest(updateWatchingSchema),

  lessonProgressController.updateWatching
);

/* =====================================================
   COMPLETE LESSON (manual)
   PATCH /lesson-progress/complete
===================================================== */
router.patch(
  "/complete",
  authenticate,

  validateRequest(completeLessonSchema),

  lessonProgressController.completeLesson
);

/* =====================================================
   SUBMIT QUIZ
   POST /lesson-progress/quiz
===================================================== */
router.post(
  "/quiz",
  authenticate,
  validateRequest(submitQuizSchema),
  lessonProgressController.submitQuiz
);

router.get("/", authenticate, lessonProgressController.list);
router.get("/:id", authenticate, lessonProgressController.getDetail);
router.post("/:id/reset", authenticate, lessonProgressController.resetProgress);

export default router;
