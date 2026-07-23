export class ApiError extends Error {
  /**
   * @param {number} status HTTP status code
   * @param {string} message Human readable message
   * @param {string} [code] Machine-readable code (e.g. AUTH_INVALID_CREDENTIALS)
   * @param {Record<string,string>} [fields] Field-level validation errors
   */
  constructor(status, message, code, fields) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(msg, code = "BAD_REQUEST", fields) {
    return new ApiError(400, msg, code, fields);
  }
  static unauthorized(msg = "Unauthorized", code = "UNAUTHORIZED") {
    return new ApiError(401, msg, code);
  }
  static forbidden(msg = "Forbidden", code = "FORBIDDEN") {
    return new ApiError(403, msg, code);
  }
  static notFound(msg = "Not found", code = "NOT_FOUND") {
    return new ApiError(404, msg, code);
  }
  static conflict(msg, code = "CONFLICT") {
    return new ApiError(409, msg, code);
  }
  static tooMany(msg = "Too many requests", code = "RATE_LIMITED") {
    return new ApiError(429, msg, code);
  }
  static internal(msg = "Internal server error", code = "INTERNAL") {
    return new ApiError(500, msg, code);
  }
}
