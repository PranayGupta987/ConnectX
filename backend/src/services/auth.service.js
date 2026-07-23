import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";
import { sha256, randomToken } from "../utils/crypto.js";
import {
  issueTokens,
  persistRefreshToken,
  revokeRefreshToken,
  verifyRefreshToken,
  isRefreshTokenActive,
} from "./token.service.js";

const googleClient = env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI)
  : null;

export const authService = {
  async signup({ email, username, displayName, password }) {
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      const field = existing.email === email ? "email" : "username";
      throw ApiError.conflict(`That ${field} is already taken`, "AUTH_TAKEN");
    }

    const user = new User({ email, username, displayName });
    await user.setPassword(password);
    // Prepare email verification token
    const verifyToken = randomToken(32);
    user.emailVerificationTokenHash = sha256(verifyToken);
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const tokens = issueTokens(user);
    await persistRefreshToken(user.id, tokens.refreshToken);
    return { user, tokens, verifyToken };
  },

  async login({ email, password }) {
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await user.verifyPassword(password))) {
      throw ApiError.unauthorized("Invalid email or password", "AUTH_INVALID_CREDENTIALS");
    }
    user.lastLoginAt = new Date();
    await user.save();

    const tokens = issueTokens(user);
    await persistRefreshToken(user.id, tokens.refreshToken);
    return { user, tokens };
  },

  async logout({ userId, refreshToken }) {
    if (userId && refreshToken) {
      await revokeRefreshToken(userId, refreshToken);
    }
  },

  async refresh(refreshToken) {
    if (!refreshToken) throw ApiError.unauthorized("Missing refresh token", "AUTH_NO_REFRESH");

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized("Invalid refresh token", "AUTH_BAD_REFRESH");
    }
    const userId = payload.sub;
    const active = await isRefreshTokenActive(userId, refreshToken);
    if (!active) throw ApiError.unauthorized("Refresh token revoked", "AUTH_REVOKED_REFRESH");

    const user = await User.findById(userId);
    if (!user) throw ApiError.unauthorized("User no longer exists", "AUTH_USER_GONE");

    // Rotate: revoke old, issue new
    await revokeRefreshToken(userId, refreshToken);
    const tokens = issueTokens(user);
    await persistRefreshToken(userId, tokens.refreshToken);
    return { user, tokens };
  },

  async forgotPassword(email) {
    const user = await User.findOne({ email });
    // Never reveal whether an account exists.
    if (!user) return { emailed: false };
    const token = randomToken(32);
    user.passwordResetTokenHash = sha256(token);
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    // TODO: hand `token` off to your email service.
    return { emailed: true, token };
  },

  async resetPassword({ token, password }) {
    const user = await User.findOne({
      passwordResetTokenHash: sha256(token),
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetTokenHash +passwordResetExpires");
    if (!user) throw ApiError.badRequest("Reset link invalid or expired", "AUTH_RESET_INVALID");
    await user.setPassword(password);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokenHashes = []; // sign out all sessions
    await user.save();
  },

  async verifyEmail(token) {
    const user = await User.findOne({
      emailVerificationTokenHash: sha256(token),
      emailVerificationExpires: { $gt: new Date() },
    }).select("+emailVerificationTokenHash +emailVerificationExpires");
    if (!user) throw ApiError.badRequest("Verification link invalid or expired", "AUTH_VERIFY_INVALID");
    user.isVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
  },

  async loginWithGoogleIdToken(idToken) {
    if (!googleClient) throw ApiError.badRequest("Google OAuth not configured", "GOOGLE_NOT_CONFIGURED");
    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email) throw ApiError.unauthorized("Google token missing email", "GOOGLE_BAD_TOKEN");

    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email }] });
    if (!user) {
      const baseUsername = (payload.email.split("@")[0] || "user").replace(/[^a-zA-Z0-9_.]/g, "");
      const username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
      user = await User.create({
        email: payload.email,
        username,
        displayName: payload.name ?? baseUsername,
        avatarUrl: payload.picture ?? null,
        provider: "google",
        googleId: payload.sub,
        isVerified: !!payload.email_verified,
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      user.provider = user.provider ?? "google";
      user.avatarUrl = user.avatarUrl ?? payload.picture ?? null;
      await user.save();
    }

    const tokens = issueTokens(user);
    await persistRefreshToken(user.id, tokens.refreshToken);
    return { user, tokens };
  },

  getGoogleAuthUrl() {
    if (!googleClient) throw ApiError.badRequest("Google OAuth not configured", "GOOGLE_NOT_CONFIGURED");
    return googleClient.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["openid", "email", "profile"],
    });
  },

  async loginWithGoogleCode(code) {
    if (!googleClient) throw ApiError.badRequest("Google OAuth not configured", "GOOGLE_NOT_CONFIGURED");
    const { tokens } = await googleClient.getToken(code);
    if (!tokens.id_token) throw ApiError.unauthorized("Google did not return an id_token", "GOOGLE_NO_IDTOKEN");
    return this.loginWithGoogleIdToken(tokens.id_token);
  },
};
