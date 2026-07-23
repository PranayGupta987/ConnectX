import { Router } from "express";
import authRoutes from "./auth.routes.js";
import friendRoutes from "./friend.routes.js";
import chatRoutes from "./chat.routes.js";
import aiRoutes from "./ai.routes.js";
import notificationRoutes from "./notification.routes.js";
import callRoutes from "./call.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "ok", data: { uptime: process.uptime() } });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/friends", friendRoutes);
router.use("/chats", chatRoutes);
router.use("/ai", aiRoutes);
router.use("/notifications", notificationRoutes);
router.use("/calls", callRoutes);

export default router;
