import express from "express";

import { studentQuizAttemptController } from "../../controllers/StudentQuizAttempt/studentQuizAttemptController.js";
import { authenticate, authorize, ROLES } from "../../middlewares/auth.js";
import { startQuizAttemptSchema } from "../../validators/quiz/studentQuizAttempt.validator.js";
import validateRequest from "../../middlewares/validateRequest.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  validateRequest(startQuizAttemptSchema),
  authorize(ROLES.STUDENT),
  studentQuizAttemptController.start
);
router.post(
  "/:attemptId/submit",

  studentQuizAttemptController.submit
);

router.get("/", studentQuizAttemptController.list);
router.get("/:id", studentQuizAttemptController.detail);
router.get("/:attemptId/answers", studentQuizAttemptController.listAnswers);

// router.put("/:id",  studentQuizAttemptController.update);
router.delete("/:id", studentQuizAttemptController.remove);
router.delete("/", studentQuizAttemptController.removeMany);

export default router;
