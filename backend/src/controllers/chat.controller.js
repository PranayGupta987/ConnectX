import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { chatService } from "../services/chat.service.js";
import { emitToUser } from "../socket/index.js";
import { notificationService } from "../services/notification.service.js";
import { NOTIFICATION_TYPES } from "../models/Notification.js";

function otherParticipantId(conversation, currentUserId) {
  return conversation.participants.find((p) => String(p.id ?? p) !== String(currentUserId))?.id ?? null;
}

export const chatController = {
  openConversation: asyncHandler(async (req, res) => {
    const { userId: otherUserId } = req.body;
    const data = await chatService.openConversation({ userId: req.userId, otherUserId });
    return ApiResponse.created(res, data);
  }),

  listConversations: asyncHandler(async (req, res) => {
    const data = await chatService.listConversations({ userId: req.userId, ...req.query });
    return ApiResponse.ok(res, data);
  }),

  getConversation: asyncHandler(async (req, res) => {
    const data = await chatService.getConversationById({ userId: req.userId, conversationId: req.params.id });
    return ApiResponse.ok(res, data);
  }),

  listMessages: asyncHandler(async (req, res) => {
    const { before, limit = 30 } = req.query;
    const data = await chatService.listMessages({
      userId: req.userId,
      conversationId: req.params.id,
      before,
      limit,
    });
    return ApiResponse.ok(res, data);
  }),

  sendMessage: asyncHandler(async (req, res) => {
    const { content, replyTo } = req.body;
    const { message, conversation } = await chatService.createMessage({
      userId: req.userId,
      conversationId: req.params.id,
      content,
      replyTo,
      imageFile: req.file ?? null,
    });
    const otherId = otherParticipantId(conversation, req.userId);
    if (otherId) {
      emitToUser(otherId, "message:receive", { message, conversation });
      emitToUser(otherId, "conversation:update", conversation);
      // Fire-and-forget notification (does not block the response).
      void notificationService
        .create({
          userId: otherId,
          type: NOTIFICATION_TYPES.NEW_MESSAGE,
          title: `${message.sender?.displayName ?? "Someone"} sent you a message`,
          body: message.content?.slice(0, 140) || (message.imageUrl ? "📷 Photo" : ""),
          actor: req.userId,
          data: { conversationId: String(conversation.id), messageId: String(message.id) },
        })
        .catch(() => {});
    }
    emitToUser(req.userId, "conversation:update", conversation);
    return ApiResponse.created(res, { message, conversation });
  }),

  editMessage: asyncHandler(async (req, res) => {
    const data = await chatService.editMessage({
      userId: req.userId,
      messageId: req.params.messageId,
      content: req.body?.content,
    });
    emitToUser(req.userId, "message:edit", data);
    // notify all participants
    const convo = await chatService.getConversationById({
      userId: req.userId,
      conversationId: String(data.conversation),
    });
    const otherId = otherParticipantId(convo, req.userId);
    if (otherId) emitToUser(otherId, "message:edit", data);
    return ApiResponse.ok(res, data);
  }),

  deleteMessage: asyncHandler(async (req, res) => {
    const data = await chatService.deleteMessage({ userId: req.userId, messageId: req.params.messageId });
    return ApiResponse.ok(res, data);
  }),

  markSeen: asyncHandler(async (req, res) => {
    const data = await chatService.markSeen({ userId: req.userId, conversationId: req.params.id });
    const convo = await chatService.getConversationById({ userId: req.userId, conversationId: req.params.id });
    const otherId = otherParticipantId(convo, req.userId);
    if (otherId) emitToUser(otherId, "message:seen", { conversationId: req.params.id, by: req.userId, at: data.seenAt });
    return ApiResponse.ok(res, data);
  }),
};
