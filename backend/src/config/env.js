import "dotenv/config";

function required(name, fallback) {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 5000),
  API_PREFIX: process.env.API_PREFIX ?? "/api",

  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:8080",
  CORS_ORIGINS: (process.env.CORS_ORIGINS ?? "http://localhost:8080")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  MONGODB_URI: required("MONGODB_URI", "mongodb://127.0.0.1:27017/connectx"),

  JWT_ACCESS_SECRET: required("JWT_ACCESS_SECRET", "dev-access-secret-change-me"),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET", "dev-refresh-secret-change-me"),
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
  GOOGLE_REDIRECT_URI:
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:5000/api/auth/google/callback",

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? "",

  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX ?? 300),

  LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
};

export const isProd = env.NODE_ENV === "production";
