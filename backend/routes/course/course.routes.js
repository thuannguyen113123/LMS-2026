import express from "express";
import { courseController } from "../../controllers/coures/course.controller.js";
import { enrollmentController } from "../../controllers/coures/enrollment.controller.js";

import {
  authenticate,
  authorize,
  authorizePermission,
  noCompression,
  optionalAuthenticate,
  ROLES,
} from "../../middlewares/auth.js";
import {
  courseBulkSchema,
  courseSchema,
  updateCourseSchema,
} from "../../validators/course/course.validator.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { lessonController } from "../../controllers/lesson/lesson.controller.js";

const router = express.Router();
router.get("/public", courseController.listPublic);

//Khóa học đề xuất
router.get("/:id/recommended", courseController.recommended);
router.get("/detail/:slug", optionalAuthenticate, courseController.detail);
router.use(authenticate);
router.get(
  "/:slug/lessons",
  authorizePermission("lessons.read"),
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.STUDENT),
  lessonController.list
);
router.get("/options", courseController.options);
router.get(
  "/my-courses",
  authorize(ROLES.STUDENT),
  courseController.listMyCourses
);

router.post(
  "/createCourse",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("courses.create"),
  validateRequest(courseSchema),
  courseController.create
);
router.post(
  "/bulk",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("courses.create"),
  validateRequest(courseBulkSchema),
  courseController.createMany
);
router.get(
  "/",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.STUDENT),
  authorizePermission("courses.read"),
  courseController.list
);

router.post(
  "/:id/enroll-free",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN, ROLES.STUDENT),
  enrollmentController.enrollFreeCourse
);
router.patch(
  "/:id/publish",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  courseController.publish
);
router.get(
  "/continue-learning",

  courseController.getContinueLearning
);

router.put(
  "/:id",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("courses.update"),
  validateRequest(updateCourseSchema),
  courseController.update
);

// Xóa nhiều khóa học
router.post(
  "/delete-many",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("courses.delete"),
  courseController.removeMany
);
router.post(
  "/export/preview",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("courses.export"),

  courseController.previewExportCourses
);

router.post(
  "/export",
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  authorizePermission("courses.export"),
  noCompression,
  courseController.exportCourses
);

export default router;
