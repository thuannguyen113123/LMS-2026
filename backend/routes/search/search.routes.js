import express from "express";
import { searchCourses } from "../../controllers/search/search.controller.js";

const router = express.Router();
router.get("/courses", searchCourses);

export default router;
