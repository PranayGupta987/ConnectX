import { io, type Socket } from "socket.io-client";
import { env } from "@/lib/env";
import { tokenStorage } from "@/lib/api-client";

/**
 * Lazy singleton Socket.io client for ConnectX.
 * The socket instance is created once and reused; listeners registered
 * through `getSocket()` persist across reconnect attempts.
 */
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  socket = io(env.SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket", "polling"],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    auth: (cb: (data: Record<string, unknown>) => void) =>
      cb({ token: tokenStorage.getAccess() }),
  });
  if (import.meta.env.DEV) {
    socket.on("connect", () => console.info("[socket] connected", socket?.id));
    socket.on("connect_error", (err) =>
      console.warn("[socket] connect_error", err.message),
    );
    socket.on("disconnect", (reason) => console.info("[socket] disconnect", reason));
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

/**
 * Resolves when the socket becomes connected, or rejects after `timeoutMs`.
 * Triggers a connect attempt if not already connecting.
 */
export function ensureSocketConnected(timeoutMs = 4000): Promise<Socket> {
  const s = getSocket();
  if (s.connected) return Promise.resolve(s);
  if (!s.active) s.connect();
  return new Promise((resolve, reject) => {
    const onConnect = () => {
      cleanup();
      resolve(s);
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Socket connection timed out"));
    }, timeoutMs);
    const cleanup = () => {
      clearTimeout(timer);
      s.off("connect", onConnect);
      s.off("connect_error", onError);
    };
    s.once("connect", onConnect);
    s.once("connect_error", onError);
  });
}

export function disconnectSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}
