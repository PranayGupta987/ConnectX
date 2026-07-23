import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

mongoose.set("strictQuery", true);

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== "production",
      serverSelectionTimeoutMS: 15_000,
    });
    logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    logger.error("MongoDB connection failed", { err: err.message });
    throw err;
  }

  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
  mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));
  mongoose.connection.on("error", (err) => logger.error("MongoDB error", { err: err.message }));
}

export async function disconnectDB() {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed");
}
