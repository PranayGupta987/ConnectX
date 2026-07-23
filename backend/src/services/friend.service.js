import mongoose from "mongoose";
import { User, USER_PUBLIC_FIELDS } from "../models/User.js";
import { FriendRequest, FRIEND_REQUEST_STATUS } from "../models/FriendRequest.js";
import { ApiError } from "../utils/ApiError.js";

const { Types } = mongoose;

function toObjectId(id) {
  if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest("Invalid id", "BAD_ID");
  return new Types.ObjectId(id);
}

export const friendService = {
  /**
   * Search users by username, displayName, or email.
   * Excludes the caller. Annotates each result with the caller's relationship.
   */
  async searchUsers({ userId, query, limit = 20, page = 1 }) {
    const meId = toObjectId(userId);
    const q = (query ?? "").trim();
    const filter = { _id: { $ne: meId } };
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ username: rx }, { displayName: rx }, { email: rx }];
    }
    const skip = Math.max(0, (Number(page) - 1) * limit);
    const [me, users, total] = await Promise.all([
      User.findById(meId).select("friends blocked"),
      User.find(filter).select(USER_PUBLIC_FIELDS).sort({ displayName: 1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    const friendSet = new Set((me?.friends ?? []).map(String));
    const blockedSet = new Set((me?.blocked ?? []).map(String));

    // Fetch pending requests involving me for annotation
    const pendings = await FriendRequest.find({
      status: FRIEND_REQUEST_STATUS.PENDING,
      $or: [
        { sender: meId, receiver: { $in: users.map((u) => u._id) } },
        { receiver: meId, sender: { $in: users.map((u) => u._id) } },
      ],
    }).select("sender receiver");
    const sentTo = new Set();
    const receivedFrom = new Set();
    for (const r of pendings) {
      if (String(r.sender) === String(meId)) sentTo.add(String(r.receiver));
      else receivedFrom.add(String(r.sender));
    }

    const items = users.map((u) => {
      const id = String(u._id);
      let relationship = "none";
      if (friendSet.has(id)) relationship = "friend";
      else if (blockedSet.has(id)) relationship = "blocked";
      else if (sentTo.has(id)) relationship = "request_sent";
      else if (receivedFrom.has(id)) relationship = "request_received";
      return { ...u.toJSON(), relationship };
    });

    return { items, total, page: Number(page), limit };
  },

  async sendRequest({ senderId, receiverId }) {
    if (String(senderId) === String(receiverId)) {
      throw ApiError.badRequest("You cannot send a request to yourself", "FRIEND_SELF");
    }
    const [sender, receiver] = await Promise.all([
      User.findById(senderId).select("friends blocked"),
      User.findById(receiverId).select("friends blocked"),
    ]);
    if (!receiver) throw ApiError.notFound("User not found", "USER_NOT_FOUND");

    if ((sender?.friends ?? []).some((f) => String(f) === String(receiverId))) {
      throw ApiError.conflict("You are already friends", "FRIEND_EXISTS");
    }
    if (
      (sender?.blocked ?? []).some((f) => String(f) === String(receiverId)) ||
      (receiver.blocked ?? []).some((f) => String(f) === String(senderId))
    ) {
      throw ApiError.forbidden("This user is unavailable", "FRIEND_BLOCKED");
    }

    // Any pending request in either direction?
    const existing = await FriendRequest.findOne({
      status: FRIEND_REQUEST_STATUS.PENDING,
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });
    if (existing) {
      if (String(existing.sender) === String(senderId)) {
        throw ApiError.conflict("Request already sent", "FRIEND_REQUEST_EXISTS");
      }
      // Reverse pending: auto-accept for a smoother UX? We keep it explicit.
      throw ApiError.conflict("This user has already sent you a request", "FRIEND_REVERSE_PENDING");
    }

    const req = await FriendRequest.create({ sender: senderId, receiver: receiverId });
    await req.populate("sender", USER_PUBLIC_FIELDS);
    await req.populate("receiver", USER_PUBLIC_FIELDS);
    return req.toJSON();
  },

  async cancelRequest({ userId, requestId }) {
    const req = await FriendRequest.findById(requestId);
    if (!req) throw ApiError.notFound("Request not found", "FRIEND_REQ_NOT_FOUND");
    if (String(req.sender) !== String(userId)) throw ApiError.forbidden("Not your request", "FRIEND_NOT_OWNER");
    if (req.status !== FRIEND_REQUEST_STATUS.PENDING) {
      throw ApiError.badRequest("Request is not pending", "FRIEND_REQ_STATE");
    }
    req.status = FRIEND_REQUEST_STATUS.CANCELLED;
    req.respondedAt = new Date();
    await req.save();
    return { id: req.id, status: req.status };
  },

  async respondToRequest({ userId, requestId, action }) {
    const req = await FriendRequest.findById(requestId);
    if (!req) throw ApiError.notFound("Request not found", "FRIEND_REQ_NOT_FOUND");
    if (String(req.receiver) !== String(userId)) throw ApiError.forbidden("Not your request", "FRIEND_NOT_RECIPIENT");
    if (req.status !== FRIEND_REQUEST_STATUS.PENDING) {
      throw ApiError.badRequest("Request is not pending", "FRIEND_REQ_STATE");
    }

    if (action === "accept") {
      req.status = FRIEND_REQUEST_STATUS.ACCEPTED;
      req.respondedAt = new Date();
      await Promise.all([
        req.save(),
        User.updateOne({ _id: req.sender }, { $addToSet: { friends: req.receiver } }),
        User.updateOne({ _id: req.receiver }, { $addToSet: { friends: req.sender } }),
      ]);
    } else {
      req.status = FRIEND_REQUEST_STATUS.REJECTED;
      req.respondedAt = new Date();
      await req.save();
    }

    await req.populate("sender", USER_PUBLIC_FIELDS);
    await req.populate("receiver", USER_PUBLIC_FIELDS);
    return req.toJSON();
  },

  async removeFriend({ userId, friendId }) {
    if (String(userId) === String(friendId)) throw ApiError.badRequest("Invalid target", "FRIEND_SELF");
    await Promise.all([
      User.updateOne({ _id: userId }, { $pull: { friends: friendId } }),
      User.updateOne({ _id: friendId }, { $pull: { friends: userId } }),
    ]);
    return { removed: true };
  },

  async listFriends({ userId, page = 1, limit = 50 }) {
    const skip = Math.max(0, (Number(page) - 1) * limit);
    const me = await User.findById(userId).select("friends");
    const ids = (me?.friends ?? []).map((f) => f);
    const [items, total] = await Promise.all([
      User.find({ _id: { $in: ids } })
        .select(USER_PUBLIC_FIELDS)
        .sort({ isOnline: -1, displayName: 1 })
        .skip(skip)
        .limit(limit),
      Promise.resolve(ids.length),
    ]);
    return { items: items.map((i) => i.toJSON()), total, page: Number(page), limit };
  },

  async listPendingIncoming({ userId, page = 1, limit = 50 }) {
    const skip = Math.max(0, (Number(page) - 1) * limit);
    const filter = { receiver: userId, status: FRIEND_REQUEST_STATUS.PENDING };
    const [items, total] = await Promise.all([
      FriendRequest.find(filter)
        .populate("sender", USER_PUBLIC_FIELDS)
        .populate("receiver", USER_PUBLIC_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      FriendRequest.countDocuments(filter),
    ]);
    return { items: items.map((i) => i.toJSON()), total, page: Number(page), limit };
  },

  async listPendingOutgoing({ userId, page = 1, limit = 50 }) {
    const skip = Math.max(0, (Number(page) - 1) * limit);
    const filter = { sender: userId, status: FRIEND_REQUEST_STATUS.PENDING };
    const [items, total] = await Promise.all([
      FriendRequest.find(filter)
        .populate("sender", USER_PUBLIC_FIELDS)
        .populate("receiver", USER_PUBLIC_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      FriendRequest.countDocuments(filter),
    ]);
    return { items: items.map((i) => i.toJSON()), total, page: Number(page), limit };
  },
};
