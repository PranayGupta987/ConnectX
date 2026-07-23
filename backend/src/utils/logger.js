import winston from "winston";
import { env } from "../config/env.js";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `${ts} ${level} ${message}${rest}`;
});

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format:
    env.NODE_ENV === "production"
      ? combine(timestamp(), errors({ stack: true }), json())
      : combine(colorize(), timestamp({ format: "HH:mm:ss" }), errors({ stack: true }), devFormat),
  transports: [new winston.transports.Console()],
});

// Morgan-compatible write stream
export const stream = {
  write: (message) => logger.http?.(message.trim()) ?? logger.info(message.trim()),
};
