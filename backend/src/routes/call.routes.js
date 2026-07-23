import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { callController } from "../controllers/call.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", callController.history);
router.delete("/", callController.clear);
router.get("/:id", callController.getOne);

export default router;
