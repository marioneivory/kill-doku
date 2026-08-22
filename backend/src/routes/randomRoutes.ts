import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as randomController from "../controllers/randomController";

const router = Router();

router.use(requireAuth);
router.get("/new", randomController.getNewRandomPuzzle);
router.post("/submit", randomController.submitRandom);

export default router;
