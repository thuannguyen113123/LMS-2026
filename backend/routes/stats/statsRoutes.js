import express from "express";
import {
  getAboutStats,
  getHeroStats,
  getHighlightStats,
} from "../../controllers/stats/stats.controller.js";

const router = express.Router();
router.get("/hero", getHeroStats);
router.get("/highlights", getHighlightStats);
router.get("/about", getAboutStats);

export default router;
