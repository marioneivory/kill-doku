import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as storyController from "../controllers/storyController";

const router = Router();

router.use(requireAuth);
router.get("/chapters", storyController.getChapters);
router.get("/level/:chapter/:level", storyController.getLevel);
router.post("/level/:chapter/:level/submit", storyController.submitLevel);

export default router;
