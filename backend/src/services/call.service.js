import { Call, CALL_STATUS, CALL_TYPES } from "../models/Call.js";
import { User, USER_PUBLIC_FIELDS } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

const POPULATE = [
  { path: "caller", select: USER_PUBLIC_FIELDS },
  { path: "receiver", select: USER_PUBLIC_FIELDS },
];

export const callService = {
  types: CALL_TYPES,
  statuses: CALL_STATUS,

  /** Create the initial call record when the caller dials. */
  async invite({ callerId, receiverId, type }) {
    if (!Object.values(CALL_TYPES).includes(type)) {
      throw ApiError.badRequest("Invalid call type", "CALL_BAD_TYPE");
    }
    if (String(callerId) === String(receiverId)) {
      throw ApiError.badRequest("You cannot call yourself", "CALL_SELF");
    }
    const receiver = await User.findById(receiverId).select("_id friends");
    if (!receiver) throw ApiError.notFound("User not found", "CALL_NO_USER");

    const call = await Call.create({
      caller: callerId,
      receiver: receiverId,
      type,
      status: CALL_STATUS.RINGING,
      startedAt: new Date(),
    });
    await call.populate(POPULATE);
    return call.toJSON();
  },

  async markConnected(callId) {
    const call = await Call.findByIdAndUpdate(
      callId,
      { status: CALL_STATUS.ONGOING, connectedAt: new Date() },
      { new: true },
    ).populate(POPULATE);
    return call?.toJSON() ?? null;
  },

  async markEnded({ callId, endedBy, reason }) {
    const call = await Call.findById(callId);
    if (!call) return null;
    if ([CALL_STATUS.ENDED, CALL_STATUS.MISSED, CALL_STATUS.REJECTED, CALL_STATUS.CANCELLED, CALL_STATUS.FAILED].includes(call.status)) {
      await call.populate(POPULATE);
      return call.toJSON();
    }
    const endedAt = new Date();
    let status = CALL_STATUS.ENDED;
    if (reason === "reject") status = CALL_STATUS.REJECTED;
    else if (reason === "cancel") status = CALL_STATUS.CANCELLED;
    else if (reason === "missed") status = CALL_STATUS.MISSED;
    else if (reason === "failed") status = CALL_STATUS.FAILED;

    const durationSec = call.connectedAt
      ? Math.max(0, Math.round((endedAt.getTime() - call.connectedAt.getTime()) / 1000))
      : 0;

    call.status = status;
    call.endedAt = endedAt;
    call.durationSec = durationSec;
    call.endedBy = endedBy ?? null;
    call.endReason = reason ?? null;
    await call.save();
    await call.populate(POPULATE);
    return call.toJSON();
  },

  async history({ userId, page = 1, limit = 20 }) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(50, Math.max(1, Number(limit) || 20));
    const filter = { $or: [{ caller: userId }, { receiver: userId }] };
    const [items, total] = await Promise.all([
      Call.find(filter)
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l)
        .populate(POPULATE),
      Call.countDocuments(filter),
    ]);
    return { items: items.map((c) => c.toJSON()), total, page: p, limit: l };
  },

  async get({ userId, callId }) {
    const call = await Call.findById(callId).populate(POPULATE);
    if (!call) throw ApiError.notFound("Call not found", "CALL_NOT_FOUND");
    const isParticipant =
      String(call.caller.id ?? call.caller) === String(userId) ||
      String(call.receiver.id ?? call.receiver) === String(userId);
    if (!isParticipant) throw ApiError.forbidden("Not your call", "CALL_FORBIDDEN");
    return call.toJSON();
  },

  async clearHistory({ userId }) {
    await Call.deleteMany({ $or: [{ caller: userId }, { receiver: userId }] });
    return { ok: true };
  },
};
