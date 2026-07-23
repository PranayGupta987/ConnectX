import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { sha256 } from "../utils/crypto.js";
import { User } from "../models/User.js";

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user.id, type: "refresh" }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

/** Persist a refresh token's hash on the user so it can be revoked individually. */
export async function persistRefreshToken(userId, token) {
  await User.updateOne(
    { _id: userId },
    { $push: { refreshTokenHashes: sha256(token) } },
  );
}

export async function revokeRefreshToken(userId, token) {
  await User.updateOne(
    { _id: userId },
    { $pull: { refreshTokenHashes: sha256(token) } },
  );
}

export async function isRefreshTokenActive(userId, token) {
  const user = await User.findById(userId).select("+refreshTokenHashes");
  if (!user) return false;
  return user.refreshTokenHashes.includes(sha256(token));
}

export function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  return { accessToken, refreshToken };
}
