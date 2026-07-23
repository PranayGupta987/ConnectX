import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { userService } from "../services/user.service.js";

export const userController = {
  updateMe: asyncHandler(async (req, res) => {
    const data = await userService.updateProfile({ userId: req.userId, patch: req.body });
    return ApiResponse.ok(res, data, "Profile updated");
  }),

  uploadAvatar: asyncHandler(async (req, res) => {
    const data = await userService.uploadAvatar({ userId: req.userId, file: req.file });
    return ApiResponse.ok(res, data, "Avatar updated");
  }),

  uploadCover: asyncHandler(async (req, res) => {
    const data = await userService.uploadCover({ userId: req.userId, file: req.file });
    return ApiResponse.ok(res, data, "Cover updated");
  }),

  changePassword: asyncHandler(async (req, res) => {
    const data = await userService.changePassword({
      userId: req.userId,
      currentPassword: req.body?.currentPassword,
      newPassword: req.body?.newPassword,
    });
    return ApiResponse.ok(res, data, "Password updated");
  }),

  logoutAll: asyncHandler(async (req, res) => {
    const data = await userService.logoutAllDevices({ userId: req.userId });
    return ApiResponse.ok(res, data, "Signed out of all devices");
  }),

  deleteMe: asyncHandler(async (req, res) => {
    const data = await userService.deleteAccount({ userId: req.userId });
    return ApiResponse.ok(res, data, "Account deleted");
  }),

  getProfile: asyncHandler(async (req, res) => {
    const data = await userService.getPublicProfile({
      userId: req.userId,
      targetId: req.params.id,
    });
    return ApiResponse.ok(res, data);
  }),
};
