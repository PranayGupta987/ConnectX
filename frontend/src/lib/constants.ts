export const APP_NAME = "ConnectX";
export const APP_TAGLINE = "Where conversations become connections.";
export const APP_DESCRIPTION =
  "ConnectX is a next-generation messaging platform blending real-time chat, AI-assisted conversations, and premium collaboration tools for teams and creators.";

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "connectx.accessToken",
  REFRESH_TOKEN: "connectx.refreshToken",
  THEME: "connectx.theme",
  SIDEBAR: "connectx.sidebar",
} as const;

export const AI_ASSISTANT = {
  ID: "connectx-ai",
  NAME: "ConnectX AI",
  USERNAME: "connectx-ai",
  TAGLINE: "Your personal assistant, always online.",
} as const;

export const ROUTES = {
  LANDING: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
  DASHBOARD: "/dashboard",
  CHAT: "/dashboard/chat",
  FRIENDS: "/dashboard/friends",
  AI: "/dashboard/ai",
  NOTIFICATIONS: "/dashboard/notifications",
  CALLS: "/dashboard/calls",
  PROFILE: "/dashboard/profile",
  SETTINGS: "/dashboard/settings",
} as const;

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/auth/login",
    SIGNUP: "/auth/signup",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    VERIFY_EMAIL: "/auth/verify-email",
    GOOGLE: "/auth/google",
  },
  USERS: {
    ROOT: "/users",
    ME: "/users/me",
    ME_AVATAR: "/users/me/avatar",
    ME_COVER: "/users/me/cover",
    ME_PASSWORD: "/users/me/password",
    ME_LOGOUT_ALL: "/users/me/logout-all",
    ONE: (id: string) => `/users/${id}`,
  },
  FRIENDS: {
    ROOT: "/friends",
    SEARCH: "/friends/search",
    REQUESTS: "/friends/requests",
    REQUESTS_INCOMING: "/friends/requests/incoming",
    REQUESTS_OUTGOING: "/friends/requests/outgoing",
    REQUEST_ACCEPT: (id: string) => `/friends/requests/${id}/accept`,
    REQUEST_REJECT: (id: string) => `/friends/requests/${id}/reject`,
    REQUEST_CANCEL: (id: string) => `/friends/requests/${id}`,
    REMOVE: (id: string) => `/friends/${id}`,
  },
  CHATS: {
    ROOT: "/chats",
    ONE: (id: string) => `/chats/${id}`,
    MESSAGES: (id: string) => `/chats/${id}/messages`,
    SEEN: (id: string) => `/chats/${id}/seen`,
    MESSAGE: (mid: string) => `/chats/messages/${mid}`,
  },
  AI: {
    CHAT: "/ai/chat",
    HISTORY: "/ai/history",
  },
  NOTIFICATIONS: {
    ROOT: "/notifications",
    UNREAD_COUNT: "/notifications/unread-count",
    READ_ALL: "/notifications/read-all",
    ONE_READ: (id: string) => `/notifications/${id}/read`,
    ONE: (id: string) => `/notifications/${id}`,
  },
  CALLS: {
    ROOT: "/calls",
    ONE: (id: string) => `/calls/${id}`,
  },
} as const;

export const SOCKET_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  // Friends
  FRIEND_REQUEST_NEW: "friendRequest:new",
  FRIEND_REQUEST_ACCEPTED: "friendRequest:accepted",
  FRIEND_REQUEST_REJECTED: "friendRequest:rejected",
  FRIEND_REMOVED: "friend:removed",
  FRIEND_ONLINE: "friend:online",
  FRIEND_OFFLINE: "friend:offline",
  STATUS_UPDATE: "status:update",
  // Chat
  MESSAGE_RECEIVE: "message:receive",
  MESSAGE_EDIT: "message:edit",
  MESSAGE_DELETE: "message:delete",
  MESSAGE_SEEN: "message:seen",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  CONVERSATION_UPDATE: "conversation:update",
  // Notifications
  NOTIFICATION_NEW: "notification:new",
  NOTIFICATION_READ: "notification:read",
  NOTIFICATION_CLEAR: "notification:clear",
  // Calls
  CALL_INVITE: "call:invite",
  CALL_ACCEPT: "call:accept",
  CALL_REJECT: "call:reject",
  CALL_CANCEL: "call:cancel",
  CALL_END: "call:end",
  CALL_INCOMING: "call:incoming",
  CALL_ACCEPTED: "call:accepted",
  CALL_REJECTED: "call:rejected",
  CALL_CANCELLED: "call:cancelled",
  CALL_ENDED: "call:ended",
  CALL_OFFER: "call:offer",
  CALL_ANSWER: "call:answer",
  CALL_ICE: "call:ice",
} as const;

export const WEBRTC_ICE_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];
