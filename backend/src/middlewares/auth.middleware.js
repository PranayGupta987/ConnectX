import { verifyAccessToken } from "../services/token.service.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/** Requires a valid access token in the Authorization: Bearer <token> header. */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw ApiError.unauthorized("Missing or malformed Authorization header", "AUTH_NO_TOKEN");
  }
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw ApiError.unauthorized(
      err.name === "TokenExpiredError" ? "Access token expired" : "Invalid access token",
      err.name === "TokenExpiredError" ? "AUTH_TOKEN_EXPIRED" : "AUTH_BAD_TOKEN",
    );
  }
  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized("User no longer exists", "AUTH_USER_GONE");

  req.user = user;
  req.userId = user.id;
  next();
});
