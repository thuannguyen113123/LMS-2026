import express from "express";
import {
  authenticate,
  authorize,
  authorizePermission,
  ROLES,
} from "../../middlewares/auth.js";
import { commentController } from "../../controllers/comment/comment.controller.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { createCommentSchema } from "./../../validators/comment/comment.validator.js";

const router = express.Router();

router.get("/testimonials", commentController.listTestimonials);

router.use(authenticate);
// static trước
router.get("/replies/:parentId", commentController.listReplies);
router.get("/stats/:targetType/:targetId", commentController.stats);
router.get("/upload", commentController.upload);

// list theo target
router.get("/:targetType/:targetId", commentController.list);

// get by id (luôn để cuối dynamic)
router.get("/:id", commentController.getById);

// tạo comment
router.post(
  "/",
  authorize(ROLES.STUDENT, ROLES.ADMIN, ROLES.INSTRUCTOR),
  authorizePermission("comments.create"),
  validateRequest(createCommentSchema),
  commentController.create
);

// comment của mình
router.get(
  "/my",
  authorize(ROLES.STUDENT, ROLES.ADMIN, ROLES.INSTRUCTOR),
  authorizePermission("comments.read"),
  commentController.getMyComments
);

router.get(
  "/",
  authorize(ROLES.ADMIN),
  authorizePermission("comments.read"),
  commentController.listAll
);
// tương tác
router.post(
  "/:id/like",
  authorize(ROLES.STUDENT, ROLES.ADMIN, ROLES.INSTRUCTOR),
  authorizePermission("comments.update"),
  commentController.like
);

router.post(
  "/:id/report",
  authorize(ROLES.STUDENT, ROLES.ADMIN, ROLES.INSTRUCTOR),
  authorizePermission("comments.update"),
  commentController.report
);

// update / delete của mình
router.put(
  "/:id",
  authorize(ROLES.STUDENT, ROLES.ADMIN, ROLES.INSTRUCTOR),
  authorizePermission("comments.update"),
  commentController.update
);

router.delete(
  "/:id",
  authorize(ROLES.STUDENT, ROLES.ADMIN, ROLES.INSTRUCTOR),
  authorizePermission("comments.delete"),

  commentController.remove
);

/* =====================================================
   ADMIN ONLY
===================================================== */

router.post(
  "/delete-many",
  authorize(ROLES.ADMIN),
  authorizePermission("comments.delete"),

  commentController.removeMany
);

router.post("/:id/restore", authorize(ROLES.ADMIN), commentController.restore);

router.post(
  "/export/preview",
  authorize(ROLES.ADMIN),
  authorizePermission("comments.export"),

  commentController.previewExportComments
);

router.post(
  "/export",
  authorize(ROLES.ADMIN),
  authorizePermission("comments.export"),
  commentController.exportComments
);

export default router;
