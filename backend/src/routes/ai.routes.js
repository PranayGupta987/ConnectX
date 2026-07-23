import { Router } from "express";
import { aiController } from "../controllers/ai.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.post("/chat", aiController.chat);
router.get("/history", aiController.history);
router.delete("/history", aiController.clear);

export default router;
