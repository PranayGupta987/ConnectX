import mongoose from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { Message, MESSAGE_TYPE } from "../models/Message.js";
import { User, USER_PUBLIC_FIELDS } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadBuffer } from "./upload.service.js";

const { Types } = mongoose;

function assertFriends(me, otherId) {
  const isFriend = (me?.friends ?? []).some((f) => String(f) === String(otherId));
  if (!isFriend) throw ApiError.forbidden("You can only chat with your friends", "CHAT_NOT_FRIEND");
}

async function findOrCreateConversation(userA, userB) {
  const [a, b] = [String(userA), String(userB)].sort();
  const participants = [new Types.ObjectId(a), new Types.ObjectId(b)];
  let convo = await Conversation.findOne({ participants: { $all: participants, $size: 2 } });
  if (!convo) convo = await Conversation.create({ participants, unread: new Map() });
  return convo;
}

async function populateConversation(convo, currentUserId) {
  const populated = await Conversation.findById(convo._id)
    .populate("participants", USER_PUBLIC_FIELDS)
    .populate({ path: "lastMessage" });
  const json = populated.toJSON();
  json.otherUser = json.participants.find((p) => String(p.id) !== String(currentUserId)) ?? null;
  json.unreadCount = (json.unread ?? {})[String(currentUserId)] ?? 0;
  return json;
}

export const chatService = {
  async openConversation({ userId, otherUserId }) {
    if (String(userId) === String(otherUserId)) {
      throw ApiError.badRequest("Cannot open a conversation with yourself", "CHAT_SELF");
    }
    const me = await User.findById(userId).select("friends");
    if (!me) throw ApiError.unauthorized();
    assertFriends(me, otherUserId);
    const convo = await findOrCreateConversation(userId, otherUserId);
    return populateConversation(convo, userId);
  },

  async listConversations({ userId, page = 1, limit = 30 }) {
    const skip = Math.max(0, (Number(page) - 1) * limit);
    const filter = { participants: userId };
    const [rows, total] = await Promise.all([
      Conversation.find(filter)
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("participants", USER_PUBLIC_FIELDS)
        .populate({ path: "lastMessage" }),
      Conversation.countDocuments(filter),
    ]);
    const items = rows.map((r) => {
      const j = r.toJSON();
      j.otherUser = j.participants.find((p) => String(p.id) !== String(userId)) ?? null;
      j.unreadCount = (j.unread ?? {})[String(userId)] ?? 0;
      return j;
    });
    return { items, total, page: Number(page), limit };
  },

  async getConversationById({ userId, conversationId }) {
    if (!Types.ObjectId.isValid(conversationId)) throw ApiError.badRequest("Invalid id", "BAD_ID");
    const convo = await Conversation.findById(conversationId);
    if (!convo) throw ApiError.notFound("Conversation not found", "CHAT_NOT_FOUND");
    if (!convo.participants.some((p) => String(p) === String(userId))) {
      throw ApiError.forbidden("Not a participant", "CHAT_NOT_PARTICIPANT");
    }
    return populateConversation(convo, userId);
  },

  async listMessages({ userId, conversationId, before, limit = 30 }) {
    if (!Types.ObjectId.isValid(conversationId)) throw ApiError.badRequest("Invalid id", "BAD_ID");
    const convo = await Conversation.findById(conversationId).select("participants");
    if (!convo) throw ApiError.notFound("Conversation not found", "CHAT_NOT_FOUND");
    if (!convo.participants.some((p) => String(p) === String(userId))) {
      throw ApiError.forbidden("Not a participant", "CHAT_NOT_PARTICIPANT");
    }
    const q = { conversation: conversationId };
    if (before) {
      const beforeDate = new Date(before);
      if (!Number.isNaN(beforeDate.getTime())) q.createdAt = { $lt: beforeDate };
    }
    const rows = await Message.find(q)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 30, 100))
      .populate("sender", USER_PUBLIC_FIELDS)
      .populate({ path: "replyTo", populate: { path: "sender", select: USER_PUBLIC_FIELDS } });
    // Return chronological ascending
    return rows.reverse().map((r) => r.toJSON());
  },

  /** Create a message. Handles text and (optional) uploaded image buffer. */
  async createMessage({ userId, conversationId, content, replyTo, imageFile }) {
    if (!Types.ObjectId.isValid(conversationId)) throw ApiError.badRequest("Invalid id", "BAD_ID");
    const convo = await Conversation.findById(conversationId);
    if (!convo) throw ApiError.notFound("Conversation not found", "CHAT_NOT_FOUND");
    if (!convo.participants.some((p) => String(p) === String(userId))) {
      throw ApiError.forbidden("Not a participant", "CHAT_NOT_PARTICIPANT");
    }

    const trimmed = (content ?? "").toString().trim();
    let type = MESSAGE_TYPE.TEXT;
    let imageUrl = null;
    let imagePublicId = null;

    if (imageFile?.buffer) {
      const uploaded = await uploadBuffer(imageFile.buffer, { folder: "connectx/chat" });
      imageUrl = uploaded.url;
      imagePublicId = uploaded.publicId;
      type = MESSAGE_TYPE.IMAGE;
    }

    if (!trimmed && !imageUrl) throw ApiError.badRequest("Message is empty", "MSG_EMPTY");

    if (replyTo && !Types.ObjectId.isValid(replyTo)) throw ApiError.badRequest("Invalid replyTo", "BAD_ID");

    const msg = await Message.create({
      conversation: conversationId,
      sender: userId,
      type,
      content: trimmed,
      imageUrl,
      imagePublicId,
      replyTo: replyTo || null,
    });

    // Update conversation last message + unread for the other participant.
    const preview = imageUrl ? "📷 Photo" : trimmed.slice(0, 120);
    const other = convo.participants.find((p) => String(p) !== String(userId));
    const unread = convo.unread ?? new Map();
    if (other) {
      const key = String(other);
      unread.set(key, (unread.get(key) ?? 0) + 1);
    }
    convo.lastMessage = msg._id;
    convo.lastMessagePreview = preview;
    convo.lastMessageAt = msg.createdAt;
    convo.unread = unread;
    await convo.save();

    const populated = await Message.findById(msg._id)
      .populate("sender", USER_PUBLIC_FIELDS)
      .populate({ path: "replyTo", populate: { path: "sender", select: USER_PUBLIC_FIELDS } });
    return { message: populated.toJSON(), conversation: await populateConversation(convo, userId) };
  },

  async editMessage({ userId, messageId, content }) {
    if (!Types.ObjectId.isValid(messageId)) throw ApiError.badRequest("Invalid id", "BAD_ID");
    const msg = await Message.findById(messageId);
    if (!msg) throw ApiError.notFound("Message not found", "MSG_NOT_FOUND");
    if (String(msg.sender) !== String(userId)) throw ApiError.forbidden("Not your message", "MSG_NOT_OWNER");
    if (msg.deletedForEveryone) throw ApiError.badRequest("Message deleted", "MSG_DELETED");
    if (msg.type !== MESSAGE_TYPE.TEXT) throw ApiError.badRequest("Only text messages can be edited", "MSG_NOT_TEXT");

    const trimmed = (content ?? "").toString().trim();
    if (!trimmed) throw ApiError.badRequest("Message is empty", "MSG_EMPTY");

    msg.content = trimmed;
    msg.edited = true;
    msg.editedAt = new Date();
    await msg.save();

    // Refresh conversation preview if this was the last message.
    await Conversation.updateOne(
      { _id: msg.conversation, lastMessage: msg._id },
      { $set: { lastMessagePreview: trimmed.slice(0, 120) } },
    );

    const populated = await Message.findById(msg._id)
      .populate("sender", USER_PUBLIC_FIELDS)
      .populate({ path: "replyTo", populate: { path: "sender", select: USER_PUBLIC_FIELDS } });
    return populated.toJSON();
  },

  async deleteMessage({ userId, messageId }) {
    if (!Types.ObjectId.isValid(messageId)) throw ApiError.badRequest("Invalid id", "BAD_ID");
    const msg = await Message.findById(messageId);
    if (!msg) throw ApiError.notFound("Message not found", "MSG_NOT_FOUND");
    if (String(msg.sender) !== String(userId)) throw ApiError.forbidden("Not your message", "MSG_NOT_OWNER");

    msg.deletedForEveryone = true;
    msg.content = "";
    msg.imageUrl = null;
    msg.imagePublicId = null;
    await msg.save();

    await Conversation.updateOne(
      { _id: msg.conversation, lastMessage: msg._id },
      { $set: { lastMessagePreview: "Message deleted" } },
    );
    return { id: msg.id, deletedForEveryone: true };
  },

  async markSeen({ userId, conversationId }) {
    if (!Types.ObjectId.isValid(conversationId)) throw ApiError.badRequest("Invalid id", "BAD_ID");
    const convo = await Conversation.findById(conversationId);
    if (!convo) throw ApiError.notFound("Conversation not found", "CHAT_NOT_FOUND");
    if (!convo.participants.some((p) => String(p) === String(userId))) {
      throw ApiError.forbidden("Not a participant", "CHAT_NOT_PARTICIPANT");
    }

    const now = new Date();
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        "seenBy.user": { $ne: userId },
      },
      { $push: { seenBy: { user: userId, at: now } } },
    );

    if (convo.unread) {
      convo.unread.set(String(userId), 0);
      await convo.save();
    }
    return { conversationId: String(conversationId), seenAt: now.toISOString() };
  },
};
