import { Notification, NOTIFICATION_TYPES } from "../models/Notification.js";
import { USER_PUBLIC_FIELDS } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { emitToUser } from "../socket/index.js";

/**
 * Notification service — pure data + realtime fan-out.
 * Controllers call `create(...)` to enqueue a notification, which persists to
 * Mongo AND broadcasts `notification:new` over Socket.io to the recipient.
 */
export const notificationService = {
  async create({ userId, type, title, body = "", actor = null, data = {} }) {
    if (!userId || !type || !title) {
      throw ApiError.badRequest("Missing notification fields", "NOTIF_INVALID");
    }
    const doc = await Notification.create({ user: userId, type, title, body, actor, data });
    const populated = await doc.populate("actor", USER_PUBLIC_FIELDS);
    const payload = populated.toJSON();
    emitToUser(String(userId), "notification:new", payload);
    return payload;
  },

  async list({ userId, page = 1, limit = 20, unreadOnly = false }) {
    const skip = Math.max(0, (Number(page) - 1) * limit);
    const filter = { user: userId };
    if (unreadOnly) filter.read = false;
    const [items, total, unread] = await Promise.all([
      Notification.find(filter)
        .populate("actor", USER_PUBLIC_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: userId, read: false }),
    ]);
    return {
      items: items.map((n) => n.toJSON()),
      total,
      unread,
      page: Number(page),
      limit,
    };
  },

  async unreadCount({ userId }) {
    return Notification.countDocuments({ user: userId, read: false });
  },

  async markRead({ userId, id }) {
    const n = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { read: true, readAt: new Date() } },
      { new: true },
    ).populate("actor", USER_PUBLIC_FIELDS);
    if (!n) throw ApiError.notFound("Notification not found", "NOTIF_NOT_FOUND");
    emitToUser(String(userId), "notification:read", { id: n.id });
    return n.toJSON();
  },

  async markAllRead({ userId }) {
    await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true, readAt: new Date() } },
    );
    emitToUser(String(userId), "notification:read", { all: true });
    return { ok: true };
  },

  async remove({ userId, id }) {
    const n = await Notification.findOneAndDelete({ _id: id, user: userId });
    if (!n) throw ApiError.notFound("Notification not found", "NOTIF_NOT_FOUND");
    emitToUser(String(userId), "notification:clear", { id });
    return { id };
  },

  async clearAll({ userId }) {
    await Notification.deleteMany({ user: userId });
    emitToUser(String(userId), "notification:clear", { all: true });
    return { ok: true };
  },
};

export { NOTIFICATION_TYPES };
