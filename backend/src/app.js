import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import { env, isProd } from "./config/env.js";
import { corsOptions } from "./config/cors.js";
import { stream } from "./utils/logger.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { globalLimiter } from "./middlewares/rateLimit.middleware.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan(isProd ? "combined" : "dev", { stream }));

  app.use(globalLimiter);
  app.use(env.API_PREFIX, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
