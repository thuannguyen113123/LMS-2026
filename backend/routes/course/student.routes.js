import express from "express";
import { authenticate, authorize, ROLES } from "../../middlewares/auth.js";
import { enrollmentController } from "../../controllers/coures/enrollment.controller.js";
import { courseController } from "../../controllers/coures/course.controller.js";

const router = express.Router();
router.use(authenticate);
router.use(authorize(ROLES.STUDENT));

router.post("/:id/enroll-free", enrollmentController.enrollFreeCourse);
router.get(
  "/continue-learning",

  courseController.getContinueLearning
);

export default router;
