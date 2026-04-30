import express from "express";
import { authenticate } from "../../middlewares/auth.js";
import { userBlockController } from "./../../controllers/userBlock/userBlockController.js";

const router = express.Router();

// 🔒 tất cả block / unblock đều cần đăng nhập
router.use(authenticate);

router.post("/", userBlockController.blockUser);
router.get("/relations", userBlockController.getMyBlocks);

router.delete("/:userId", userBlockController.unblockUser);

export default router;
