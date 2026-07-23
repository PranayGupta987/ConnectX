import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { friendService } from "../services/friend.service.js";
import { emitToUser } from "../socket/index.js";
import { notificationService } from "../services/notification.service.js";
import { NOTIFICATION_TYPES } from "../models/Notification.js";

export const friendController = {
  searchUsers: asyncHandler(async (req, res) => {
    const { q = "", page = 1, limit = 20 } = req.query;
    const data = await friendService.searchUsers({
      userId: req.userId,
      query: String(q),
      page: Number(page),
      limit: Math.min(Number(limit) || 20, 50),
    });
    return ApiResponse.ok(res, data);
  }),

  sendRequest: asyncHandler(async (req, res) => {
    const { receiverId } = req.body;
    const data = await friendService.sendRequest({ senderId: req.userId, receiverId });
    emitToUser(receiverId, "friendRequest:new", data);
    void notificationService
      .create({
        userId: receiverId,
        type: NOTIFICATION_TYPES.FRIEND_REQUEST,
        title: `${data.sender?.displayName ?? "Someone"} sent you a friend request`,
        body: `@${data.sender?.username ?? ""}`,
        actor: req.userId,
        data: { requestId: String(data.id) },
      })
      .catch(() => {});
    return ApiResponse.created(res, data);
  }),

  cancelRequest: asyncHandler(async (req, res) => {
    const data = await friendService.cancelRequest({ userId: req.userId, requestId: req.params.id });
    return ApiResponse.ok(res, data);
  }),

  acceptRequest: asyncHandler(async (req, res) => {
    const data = await friendService.respondToRequest({
      userId: req.userId,
      requestId: req.params.id,
      action: "accept",
    });
    emitToUser(String(data.sender.id), "friendRequest:accepted", data);
    emitToUser(String(data.receiver.id), "friendRequest:accepted", data);
    void notificationService
      .create({
        userId: String(data.sender.id),
        type: NOTIFICATION_TYPES.FRIEND_ACCEPTED,
        title: `${data.receiver?.displayName ?? "Someone"} accepted your friend request`,
        body: "You can now chat with them.",
        actor: String(data.receiver.id),
        data: { userId: String(data.receiver.id) },
      })
      .catch(() => {});
    return ApiResponse.ok(res, data);
  }),

  rejectRequest: asyncHandler(async (req, res) => {
    const data = await friendService.respondToRequest({
      userId: req.userId,
      requestId: req.params.id,
      action: "reject",
    });
    emitToUser(String(data.sender.id), "friendRequest:rejected", data);
    return ApiResponse.ok(res, data);
  }),

  removeFriend: asyncHandler(async (req, res) => {
    const data = await friendService.removeFriend({ userId: req.userId, friendId: req.params.id });
    emitToUser(req.params.id, "friend:removed", { by: req.userId });
    return ApiResponse.ok(res, data);
  }),

  listFriends: asyncHandler(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    const data = await friendService.listFriends({
      userId: req.userId,
      page: Number(page),
      limit: Math.min(Number(limit) || 50, 100),
    });
    return ApiResponse.ok(res, data);
  }),

  listIncomingRequests: asyncHandler(async (req, res) => {
    const data = await friendService.listPendingIncoming({ userId: req.userId, ...req.query });
    return ApiResponse.ok(res, data);
  }),

  listOutgoingRequests: asyncHandler(async (req, res) => {
    const data = await friendService.listPendingOutgoing({ userId: req.userId, ...req.query });
    return ApiResponse.ok(res, data);
  }),
};
