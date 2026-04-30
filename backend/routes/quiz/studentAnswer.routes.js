import express from "express";

import { studentAnswerController } from "../../controllers/quiz/studentAnswerController.js";
import { authenticate } from "../../middlewares/auth.js";

const router = express.Router();

router.post("/", authenticate, studentAnswerController.create);
router.post("/bulk", authenticate, studentAnswerController.createMany);

router.get("/", authenticate, studentAnswerController.list);
router.get("/:id", authenticate, studentAnswerController.detail);

router.put("/:id", authenticate, studentAnswerController.update);
router.delete("/:id", authenticate, studentAnswerController.remove);
router.delete("/", authenticate, studentAnswerController.removeMany);

export default router;
