export type ID = string;

export interface User {
  id: ID;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  status?: string | null;
  isVerified?: boolean;
  isOnline?: boolean;
  lastSeen?: string | null;
  createdAt?: string;
}

export interface PublicProfile extends User {
  friendsCount: number;
  isSelf: boolean;
  isFriend: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export type Theme = "light" | "dark" | "system";

// ---- Friends ----
export type FriendRelationship =
  | "none"
  | "friend"
  | "request_sent"
  | "request_received"
  | "blocked";

export interface SearchedUser extends User {
  relationship: FriendRelationship;
}

export type FriendRequestStatus = "pending" | "accepted" | "rejected" | "cancelled";

export interface FriendRequest {
  id: ID;
  sender: User;
  receiver: User;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
  respondedAt?: string | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ---- Chat ----
export type MessageType = "text" | "image" | "system";

export interface Message {
  id: ID;
  conversation: ID;
  sender: User;
  type: MessageType;
  content: string;
  imageUrl?: string | null;
  replyTo?: Message | null;
  edited: boolean;
  editedAt?: string | null;
  deletedForEveryone: boolean;
  seenBy: Array<{ user: ID; at: string }>;
  deliveredTo?: Array<{ user: ID; at: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: ID;
  participants: User[];
  otherUser: User | null;
  lastMessage: Message | null;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  unread: Record<string, number>;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PresencePayload {
  userId: ID;
  isOnline: boolean;
  lastSeen: string;
}

// ---- AI ----
export type AIRole = "user" | "assistant" | "system";

export interface AIMessage {
  id: ID;
  role: AIRole;
  content: string;
  model?: string | null;
  createdAt: string;
  /** True while assistant tokens are streaming. UI-only. */
  streaming?: boolean;
}

export interface AIConversation {
  id: ID;
  user: ID;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

// ---- Notifications ----
export type NotificationType =
  | "friend_request"
  | "friend_accepted"
  | "new_message"
  | "ai_mention"
  | "system";

export interface AppNotification {
  id: ID;
  user: ID;
  type: NotificationType;
  title: string;
  body: string;
  actor?: User | null;
  data?: Record<string, unknown>;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsPage extends Paginated<AppNotification> {
  unread: number;
}

// ---- Calls ----
export type CallType = "audio" | "video";
export type CallStatus =
  | "ringing"
  | "ongoing"
  | "ended"
  | "missed"
  | "rejected"
  | "cancelled"
  | "failed";

export interface CallRecord {
  id: ID;
  caller: User;
  receiver: User;
  type: CallType;
  status: CallStatus;
  startedAt: string;
  connectedAt?: string | null;
  endedAt?: string | null;
  durationSec: number;
  endedBy?: ID | null;
  endReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CallsPage extends Paginated<CallRecord> {}

