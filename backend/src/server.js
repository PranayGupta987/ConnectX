import http from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { initSocket } from "./socket/index.js";
import { logger } from "./utils/logger.js";
import dns from "dns";

dns.setServers(["1.1.1.1","8.8.8.8"]);
console.log({
  AI_PROVIDER: process.env.AI_PROVIDER,
  AI_MODEL: process.env.AI_MODEL,
  GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
  OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
  XAI_API_KEY: !!process.env.XAI_API_KEY,
});
console.log(process.env.GEMINI_API_KEY);
async function bootstrap() {
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);
  const io = initSocket(httpServer);

  // Make io available on the Express app so controllers can emit
  app.set("io", io);

  httpServer.listen(env.PORT, () => {
    logger.info(`ConnectX API listening on http://localhost:${env.PORT}${env.API_PREFIX}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });

  const shutdown = (signal) => async () => {
    logger.info(`Received ${signal}, shutting down…`);
    httpServer.close(() => logger.info("HTTP server closed"));
    io.close(() => logger.info("Socket.io closed"));
    try {
      await disconnectDB();
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGINT", shutdown("SIGINT"));
  process.on("SIGTERM", shutdown("SIGTERM"));
  process.on("unhandledRejection", (reason) => logger.error("Unhandled rejection", { reason }));
  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception", { err: err.stack });
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.error("Fatal bootstrap error", { err: err.stack });
  process.exit(1);
});
