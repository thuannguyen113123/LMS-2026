import express from "express";
import { questionController } from "../../controllers/quiz/question.controller.js";
import {
  authenticate,
  authorize,
  authorizePermission,
  noCompression,
  ROLES,
} from "../../middlewares/auth.js";
import {
  questionBulkSchema,
  questionSchema,
} from "../../validators/quiz/question.validator.js";
import validateRequest from "../../middlewares/validateRequest.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  authorize(ROLES.ADMIN, ROLES.INSTRUCTOR),
  authorizePermission("questions.create"),
  validateRequest(questionSchema),
  questionController.create
);
router.post(
  "/bulk",

  authorize(ROLES.ADMIN, ROLES.INSTRUCTOR),
  authorizePermission("questions.create"),
  validateRequest(questionBulkSchema),
  questionController.createMany
);

router.get(
  "/",

  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.STUDENT),
  authorizePermission("questions.read"),

  questionController.list
);
router.get(
  "/by-quiz/:quizId",

  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.STUDENT),
  authorizePermission("questions.read"),

  questionController.getByQuiz
);
router.get(
  "/:id",
  authorizePermission("questions.read"),
  questionController.detail
);

router.put(
  "/:id",

  authorizePermission("questions.update"),
  questionController.update
);
router.delete(
  "/:id",

  authorizePermission("questions.delete"),
  questionController.remove
);
router.post(
  "/delete-many",

  authorizePermission("questions.delete"),
  questionController.removeMany
);

router.post(
  "/export/preview",

  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("questions.export"),

  questionController.previewExportQuestions
);

router.post(
  "/export",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("questions.export"),

  noCompression,
  questionController.exportQuestions
);

export default router;
