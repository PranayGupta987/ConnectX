import { env } from "./env.js";
import { ApiError } from "../utils/ApiError.js";

const allowlist = new Set(env.CORS_ORIGINS);

export const corsOptions = {
  origin(origin, cb) {
    // Allow tools like curl / server-to-server (no origin header)
    if (!origin) return cb(null, true);
    if (allowlist.has(origin)) return cb(null, true);
    return cb(new ApiError(403, `Origin not allowed by CORS: ${origin}`, "CORS_FORBIDDEN"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  maxAge: 600,
};
