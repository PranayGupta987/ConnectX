import { Server } from "socket.io";
import { verifyAccessToken } from "../services/token.service.js";
import { corsOptions } from "../config/cors.js";
import { logger } from "../utils/logger.js";
import { User } from "../models/User.js";
import { chatService } from "../services/chat.service.js";
import { callService } from "../services/call.service.js";
import { env } from "../config/env.js";

/** @type {import('socket.io').Server | null} */
let ioRef = null;

/** userId → Set<socketId> */
const userSockets = new Map();

function addUserSocket(userId, socketId) {
  const key = String(userId);
  const set = userSockets.get(key) ?? new Set();
  set.add(socketId);
  userSockets.set(key, set);
  return set.size;
}

function removeUserSocket(userId, socketId) {
  const key = String(userId);
  const set = userSockets.get(key);
  if (!set) return 0;
  set.delete(socketId);
  if (set.size === 0) userSockets.delete(key);
  return set.size;
}

/** Emit an event to every socket a user has open (excluding an optional origin socket). */
export function emitToUser(userId, event, payload, excludeSocketId) {
  if (!ioRef || !userId) return;
  const room = `user:${userId}`;
  if (excludeSocketId) ioRef.to(room).except(excludeSocketId).emit(event, payload);
  else ioRef.to(room).emit(event, payload);
}

export function isUserOnline(userId) {
  return userSockets.has(String(userId));
}

export function getIO() {
  return ioRef;
}

async function broadcastPresence(userId, isOnline) {
  const user = await User.findById(userId).select("friends");
  if (!user) return;
  const payload = { userId: String(userId), isOnline, lastSeen: new Date().toISOString() };
  for (const friendId of user.friends ?? []) {
    emitToUser(String(friendId), isOnline ? "friend:online" : "friend:offline", payload);
    emitToUser(String(friendId), "status:update", payload);
  }
}

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    },
    pingTimeout: 30_000,
    pingInterval: 25_000,
  });
  ioRef = io;

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Missing token"));
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      return next();
    } catch (err) {
      logger.warn("Socket auth rejected", { err: err.message });
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const { userId } = socket.data;
    logger.info(`Socket connected user=${userId} sid=${socket.id}`);
    socket.join(`user:${userId}`);

    const count = addUserSocket(userId, socket.id);
    if (count === 1) {
      await User.updateOne({ _id: userId }, { $set: { isOnline: true, lastSeen: new Date() } });
      await broadcastPresence(userId, true);
    }

    // --- Typing indicators ---
    socket.on("typing:start", ({ conversationId, toUserId }) => {
      if (toUserId) emitToUser(toUserId, "typing:start", { conversationId, userId });
    });
    socket.on("typing:stop", ({ conversationId, toUserId }) => {
      if (toUserId) emitToUser(toUserId, "typing:stop", { conversationId, userId });
    });

    // --- Realtime seen ---
    socket.on("message:seen", async ({ conversationId }, ack) => {
      try {
        await chatService.markSeen({ userId, conversationId });
        const convo = await chatService.getConversationById({ userId, conversationId });
        const other = convo.participants.find((p) => String(p.id) !== String(userId));
        if (other) {
          emitToUser(String(other.id), "message:seen", {
            conversationId,
            by: userId,
            at: new Date().toISOString(),
          });
        }
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    // ------------------------------------------------------------------
    // CALL SIGNALING (WebRTC)
    // Server only routes messages; media never touches it. All events are
    // authenticated by the socket auth middleware above.
    // ------------------------------------------------------------------

    // Caller initiates a call. { toUserId, type: 'audio'|'video' }
    socket.on("call:invite", async ({ toUserId, type }, ack) => {
      try {
        if (!toUserId) throw new Error("Missing toUserId");
        if (!isUserOnline(toUserId)) {
          const call = await callService.invite({ callerId: userId, receiverId: toUserId, type });
          await callService.markEnded({ callId: call.id, endedBy: userId, reason: "missed" });
          return ack?.({ ok: false, error: "User is offline" });
        }
        const call = await callService.invite({ callerId: userId, receiverId: toUserId, type });
        emitToUser(toUserId, "call:incoming", { call });
        ack?.({ ok: true, call });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("call:accept", async ({ callId, toUserId }, ack) => {
      try {
        const call = await callService.markConnected(callId);
        emitToUser(toUserId, "call:accepted", { call });
        ack?.({ ok: true, call });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("call:reject", async ({ callId, toUserId, reason }, ack) => {
      try {
        const call = await callService.markEnded({
          callId,
          endedBy: userId,
          reason: reason || "reject",
        });
        emitToUser(toUserId, "call:rejected", { call, reason });
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("call:cancel", async ({ callId, toUserId }, ack) => {
      try {
        const call = await callService.markEnded({ callId, endedBy: userId, reason: "cancel" });
        emitToUser(toUserId, "call:cancelled", { call });
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("call:end", async ({ callId, toUserId, reason }, ack) => {
      try {
        const call = await callService.markEnded({
          callId,
          endedBy: userId,
          reason: reason || "end",
        });
        emitToUser(toUserId, "call:ended", { call });
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    // WebRTC SDP + ICE relays (opaque to server).
    socket.on("call:offer", ({ toUserId, callId, sdp }) => {
      emitToUser(toUserId, "call:offer", { callId, sdp, from: userId });
    });
    socket.on("call:answer", ({ toUserId, callId, sdp }) => {
      emitToUser(toUserId, "call:answer", { callId, sdp, from: userId });
    });
    socket.on("call:ice", ({ toUserId, callId, candidate }) => {
      emitToUser(toUserId, "call:ice", { callId, candidate, from: userId });
    });

    socket.on("presence:ping", (ack) => ack?.({ ok: true, at: Date.now() }));

    socket.on("disconnect", async (reason) => {
      logger.info(`Socket disconnected user=${userId} sid=${socket.id} reason=${reason}`);
      const remaining = removeUserSocket(userId, socket.id);
      if (remaining === 0) {
        const lastSeen = new Date();
        await User.updateOne({ _id: userId }, { $set: { isOnline: false, lastSeen } });
        await broadcastPresence(userId, false);
      }
    });
  });

  return io;
}
