import express from "express";
import { chatSuggestionController } from "../../controllers/chat/chatSuggestion.controller.js";
import { chatRequestController } from "../../controllers/chat/chatRequest.controller.js";
import { authenticate } from "../../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/suggestions", chatSuggestionController.getSuggestions);

router.post("/", chatRequestController.sendRequest);

router.post("/:requestId/accept", chatRequestController.acceptRequest);

router.post("/:requestId/reject", chatRequestController.rejectRequest);
router.get("/", chatRequestController.getRequests);

export default router;
