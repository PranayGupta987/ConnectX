import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validationHandler } from "../middlewares/error.middleware.js";
import { authLimiter } from "../middlewares/rateLimit.middleware.js";
import {
  signupValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  verifyEmailValidator,
  googleIdTokenValidator,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/signup", authLimiter, signupValidator, validationHandler, authController.signup);
router.post("/login", authLimiter, loginValidator, validationHandler, authController.login);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refresh);
router.get("/me", requireAuth, authController.me);

router.post(
  "/forgot-password",
  authLimiter,
  forgotPasswordValidator,
  validationHandler,
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  authLimiter,
  resetPasswordValidator,
  validationHandler,
  authController.resetPassword,
);
router.post(
  "/verify-email",
  verifyEmailValidator,
  validationHandler,
  authController.verifyEmail,
);

// Google OAuth
router.post("/google", googleIdTokenValidator, validationHandler, authController.googleIdToken);
router.get("/google/redirect", authController.googleRedirect);
router.get("/google/callback", authController.googleCallback);

export default router;
