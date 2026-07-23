import { Router } from "express";
import { notificationController } from "../controllers/notification.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", notificationController.list);
router.get("/unread-count", notificationController.unreadCount);
router.post("/read-all", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markRead);
router.delete("/:id", notificationController.remove);
router.delete("/", notificationController.clearAll);

export default router;
