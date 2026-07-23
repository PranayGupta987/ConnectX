import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadBuffer, destroyAsset } from "./upload.service.js";

function extractPublicIdFromUrl(url) {
  if (!url) return null;
  const match = String(url).match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match?.[1] ?? null;
}

export const userService = {
  async updateProfile({ userId, patch }) {
    const allowed = ["displayName", "bio", "username", "status"];
    const update = {};
    for (const k of allowed) if (patch[k] !== undefined) update[k] = patch[k];

    if (update.username) {
      const clash = await User.findOne({
        _id: { $ne: userId },
        username: update.username,
      }).select("_id");
      if (clash) throw ApiError.conflict("Username already taken", "USER_USERNAME_TAKEN");
    }

    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true, runValidators: true });
    if (!user) throw ApiError.notFound("User not found");
    return user.toJSON();
  },

  async uploadAvatar({ userId, file }) {
    if (!file) throw ApiError.badRequest("No file provided", "UPLOAD_MISSING");
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    const previousId = extractPublicIdFromUrl(user.avatarUrl);
    const uploaded = await uploadBuffer(file.buffer, {
      folder: `connectx/avatars`,
      publicId: `user_${userId}`,
    });
    user.avatarUrl = uploaded.url;
    await user.save();
    if (previousId && previousId !== uploaded.publicId) {
      await destroyAsset(previousId).catch(() => {});
    }
    return user.toJSON();
  },

  async uploadCover({ userId, file }) {
    if (!file) throw ApiError.badRequest("No file provided", "UPLOAD_MISSING");
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    const previousId = extractPublicIdFromUrl(user.coverUrl);
    const uploaded = await uploadBuffer(file.buffer, {
      folder: `connectx/covers`,
      publicId: `user_${userId}_cover`,
    });
    user.coverUrl = uploaded.url;
    await user.save();
    if (previousId && previousId !== uploaded.publicId) {
      await destroyAsset(previousId).catch(() => {});
    }
    return user.toJSON();
  },

  async changePassword({ userId, currentPassword, newPassword }) {
    const user = await User.findById(userId).select("+passwordHash");
    if (!user) throw ApiError.notFound("User not found");
    if (user.provider === "google" && !user.passwordHash) {
      // Set an initial password for Google-only accounts
      await user.setPassword(newPassword);
      user.refreshTokenHashes = [];
      await user.save();
      return { ok: true };
    }
    if (!(await user.verifyPassword(currentPassword ?? ""))) {
      throw ApiError.unauthorized("Current password is incorrect", "AUTH_INVALID_CURRENT");
    }
    await user.setPassword(newPassword);
    user.refreshTokenHashes = []; // revoke other sessions
    await user.save();
    return { ok: true };
  },

  async logoutAllDevices({ userId }) {
    await User.updateOne({ _id: userId }, { $set: { refreshTokenHashes: [] } });
    return { ok: true };
  },

  async deleteAccount({ userId }) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");
    const avatarId = extractPublicIdFromUrl(user.avatarUrl);
    const coverId = extractPublicIdFromUrl(user.coverUrl);
    await User.deleteOne({ _id: userId });
    if (avatarId) await destroyAsset(avatarId).catch(() => {});
    if (coverId) await destroyAsset(coverId).catch(() => {});
    return { ok: true };
  },

  async getPublicProfile({ userId, targetId }) {
    const user = await User.findById(targetId).select(
      "id username displayName avatarUrl coverUrl bio status isOnline lastSeen friends createdAt",
    );
    if (!user) throw ApiError.notFound("User not found");
    const json = user.toJSON();
    const isSelf = String(userId) === String(targetId);
    return {
      ...json,
      friendsCount: user.friends?.length ?? 0,
      isSelf,
      isFriend: !isSelf && (user.friends ?? []).some((f) => String(f) === String(userId)),
    };
  },
};
