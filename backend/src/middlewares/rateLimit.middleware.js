import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    code: "RATE_LIMITED",
    message: "Too many requests, please slow down.",
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    code: "AUTH_RATE_LIMITED",
    message: "Too many attempts. Try again in a few minutes.",
  },
});
