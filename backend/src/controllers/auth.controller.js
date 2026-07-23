import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { authService } from "../services/auth.service.js";
import { env, isProd } from "../config/env.js";

const REFRESH_COOKIE = "connectx_rt";

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: env.API_PREFIX + "/auth",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, { path: env.API_PREFIX + "/auth" });
}

function readRefreshToken(req) {
  return req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken || null;
}

export const authController = {
  signup: asyncHandler(async (req, res) => {
    const { user, tokens } = await authService.signup(req.body);
    setRefreshCookie(res, tokens.refreshToken);
    return ApiResponse.created(
      res,
      { user: user.toJSON(), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
      "Account created",
    );
  }),

  login: asyncHandler(async (req, res) => {
    const { user, tokens } = await authService.login(req.body);
    setRefreshCookie(res, tokens.refreshToken);
    return ApiResponse.ok(
      res,
      { user: user.toJSON(), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
      "Signed in",
    );
  }),

  logout: asyncHandler(async (req, res) => {
    const refreshToken = readRefreshToken(req);
    await authService.logout({ userId: req.userId, refreshToken });
    clearRefreshCookie(res);
    return ApiResponse.ok(res, null, "Signed out");
  }),

  refresh: asyncHandler(async (req, res) => {
    const refreshToken = readRefreshToken(req);
    const { user, tokens } = await authService.refresh(refreshToken);
    setRefreshCookie(res, tokens.refreshToken);
    return ApiResponse.ok(
      res,
      { user: user.toJSON(), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
      "Refreshed",
    );
  }),

  me: asyncHandler(async (req, res) => ApiResponse.ok(res, req.user.toJSON(), "OK")),

  forgotPassword: asyncHandler(async (req, res) => {
    await authService.forgotPassword(req.body.email);
    return ApiResponse.ok(res, null, "If the email exists, a reset link has been sent");
  }),

  resetPassword: asyncHandler(async (req, res) => {
    await authService.resetPassword(req.body);
    return ApiResponse.ok(res, null, "Password updated");
  }),

  verifyEmail: asyncHandler(async (req, res) => {
    await authService.verifyEmail(req.body.token);
    return ApiResponse.ok(res, null, "Email verified");
  }),

  googleIdToken: asyncHandler(async (req, res) => {
    const { user, tokens } = await authService.loginWithGoogleIdToken(req.body.idToken);
    setRefreshCookie(res, tokens.refreshToken);
    return ApiResponse.ok(
      res,
      { user: user.toJSON(), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
      "Signed in with Google",
    );
  }),

  googleRedirect: asyncHandler(async (_req, res) => {
    const url = authService.getGoogleAuthUrl();
    res.redirect(url);
  }),

  googleCallback: asyncHandler(async (req, res) => {
    const code = String(req.query.code || "");
    const { tokens } = await authService.loginWithGoogleCode(code);
    setRefreshCookie(res, tokens.refreshToken);
    // Return the user to the SPA with the access token as a URL fragment so it never hits server logs.
    const target = new URL("/auth/google/return", env.CLIENT_URL);
    target.hash = `access_token=${tokens.accessToken}`;
    res.redirect(target.toString());
  }),
};
