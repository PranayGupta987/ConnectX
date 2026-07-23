import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { uploadImage } from "../middlewares/upload.middleware.js";
import { userController } from "../controllers/user.controller.js";

const router = Router();

router.use(requireAuth);

router.patch("/me", userController.updateMe);
router.post("/me/avatar", uploadImage.single("file"), userController.uploadAvatar);
router.post("/me/cover", uploadImage.single("file"), userController.uploadCover);
router.post("/me/password", userController.changePassword);
router.post("/me/logout-all", userController.logoutAll);
router.delete("/me", userController.deleteMe);
router.get("/:id", userController.getProfile);

export default router;
