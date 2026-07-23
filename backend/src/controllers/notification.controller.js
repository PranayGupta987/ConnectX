import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { notificationService } from "../services/notification.service.js";

export const notificationController = {
  list: asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const data = await notificationService.list({
      userId: req.userId,
      page: Number(page),
      limit: Math.min(Number(limit) || 20, 50),
      unreadOnly: unreadOnly === "true" || unreadOnly === "1",
    });
    return ApiResponse.ok(res, data);
  }),

  unreadCount: asyncHandler(async (req, res) => {
    const unread = await notificationService.unreadCount({ userId: req.userId });
    return ApiResponse.ok(res, { unread });
  }),

  markRead: asyncHandler(async (req, res) => {
    const data = await notificationService.markRead({ userId: req.userId, id: req.params.id });
    return ApiResponse.ok(res, data);
  }),

  markAllRead: asyncHandler(async (req, res) => {
    const data = await notificationService.markAllRead({ userId: req.userId });
    return ApiResponse.ok(res, data);
  }),

  remove: asyncHandler(async (req, res) => {
    const data = await notificationService.remove({ userId: req.userId, id: req.params.id });
    return ApiResponse.ok(res, data);
  }),

  clearAll: asyncHandler(async (req, res) => {
    const data = await notificationService.clearAll({ userId: req.userId });
    return ApiResponse.ok(res, data);
  }),
};
