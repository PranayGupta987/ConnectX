import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { isProd } from "../config/env.js";

export function validationHandler(req, _res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const fields = {};
  for (const e of errors.array({ onlyFirstError: true })) {
    if (e.type === "field" && !fields[e.path]) fields[e.path] = e.msg;
  }
  next(ApiError.badRequest("Validation failed", "VALIDATION", fields));
}

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const isApi = err instanceof ApiError;
  let status = isApi ? err.status : err.status || err.statusCode || 500;
  let code = isApi ? err.code : err.code || undefined;
  let message = err.message || "Something went wrong";
  let fields = isApi ? err.fields : undefined;

  // Mongoose errors → typed
  if (err.name === "ValidationError") {
    status = 400;
    code = "VALIDATION";
    fields = {};
    for (const [k, v] of Object.entries(err.errors ?? {})) fields[k] = v.message;
    message = "Validation failed";
  } else if (err.code === 11000) {
    status = 409;
    code = "DUPLICATE_KEY";
    const key = Object.keys(err.keyValue ?? {})[0] ?? "field";
    fields = { [key]: `${key} already in use` };
    message = "Duplicate value";
  }

  if (status >= 500) {
    logger.error(message, { err: err.stack, path: req.originalUrl, method: req.method });
  } else {
    logger.warn(`${status} ${req.method} ${req.originalUrl} — ${message}`);
  }

  res.status(status).json({
    success: false,
    message,
    code,
    fields,
    ...(isProd ? {} : { stack: err.stack }),
  });
}
