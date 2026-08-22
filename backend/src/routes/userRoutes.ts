import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as userController from "../controllers/userController";

const router = Router();

router.use(requireAuth);
router.get("/me", userController.getMe);
router.patch("/theme", userController.patchTheme);
router.get("/progress", userController.getProgress);

export default router;
