import { useEffect } from "react";
import { toast } from "sonner";
import { connectSocket, disconnectSocket, getSocket } from "@/services/socket-service";
import { useAuthStore } from "@/store/auth-store";
import { useFriendsStore } from "@/store/friends-store";
import { useChatStore } from "@/store/chat-store";
import { useNotificationStore } from "@/store/notification-store";
import { SOCKET_EVENTS } from "@/lib/constants";
import type {
  AppNotification,
  Conversation,
  FriendRequest,
  Message,
  PresencePayload,
} from "@/types";

/**
 * Global realtime bridge. Connects the Socket.io client once the user is
 * authenticated and wires backend events into the friends + chat stores.
 */
export function useRealtimeSync() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket();

    const friends = useFriendsStore.getState();
    const chat = useChatStore.getState();

    const onFriendRequestNew = (req: FriendRequest) => {
      useFriendsStore.getState().applyIncomingNew(req);
      toast.info(`${req.sender.displayName} sent you a friend request`);
    };
    const onFriendRequestAccepted = (req: FriendRequest) => {
      useFriendsStore.getState().applyAccepted(req, user.id);
    };
    const onFriendRequestRejected = (req: FriendRequest) => {
      useFriendsStore.getState().applyRejected(req);
    };
    const onFriendRemoved = ({ by }: { by: string }) => {
      useFriendsStore.getState().applyFriendRemoved(by);
    };
    const onPresence = (p: PresencePayload) => {
      useFriendsStore.getState().applyPresence(p.userId, p.isOnline, p.lastSeen);
    };

    const onMessageReceive = ({
      message,
      conversation,
    }: {
      message: Message;
      conversation: Conversation;
    }) => {
      useChatStore.getState().applyIncomingMessage(message, conversation, user.id);
    };
    const onMessageEdit = (message: Message) => {
      useChatStore.getState().applyMessageEdit(message);
    };
    const onMessageDelete = (payload: { id: string; conversationId: string }) => {
      useChatStore.getState().applyMessageDelete(payload);
    };
    const onSeen = (payload: { conversationId: string; by: string; at: string }) => {
      useChatStore.getState().applySeen(payload);
    };
    const onConversationUpdate = (conversation: Conversation) => {
      useChatStore.getState().applyConversationUpdate(conversation);
    };
    const onTypingStart = ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      useChatStore.getState().applyTyping(conversationId, userId, true);
    };
    const onTypingStop = ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      useChatStore.getState().applyTyping(conversationId, userId, false);
    };

    const onNotificationNew = (n: AppNotification) => {
      useNotificationStore.getState().applyIncoming(n);
      toast(n.title, { description: n.body });
    };
    const onNotificationRead = (payload: { id?: string; all?: boolean }) => {
      useNotificationStore.getState().applyRead(payload);
    };
    const onNotificationClear = (payload: { id?: string; all?: boolean }) => {
      useNotificationStore.getState().applyCleared(payload);
    };

    socket.on(SOCKET_EVENTS.FRIEND_REQUEST_NEW, onFriendRequestNew);
    socket.on(SOCKET_EVENTS.FRIEND_REQUEST_ACCEPTED, onFriendRequestAccepted);
    socket.on(SOCKET_EVENTS.FRIEND_REQUEST_REJECTED, onFriendRequestRejected);
    socket.on(SOCKET_EVENTS.FRIEND_REMOVED, onFriendRemoved);
    socket.on(SOCKET_EVENTS.FRIEND_ONLINE, onPresence);
    socket.on(SOCKET_EVENTS.FRIEND_OFFLINE, onPresence);
    socket.on(SOCKET_EVENTS.STATUS_UPDATE, onPresence);
    socket.on(SOCKET_EVENTS.MESSAGE_RECEIVE, onMessageReceive);
    socket.on(SOCKET_EVENTS.MESSAGE_EDIT, onMessageEdit);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETE, onMessageDelete);
    socket.on(SOCKET_EVENTS.MESSAGE_SEEN, onSeen);
    socket.on(SOCKET_EVENTS.CONVERSATION_UPDATE, onConversationUpdate);
    socket.on(SOCKET_EVENTS.TYPING_START, onTypingStart);
    socket.on(SOCKET_EVENTS.TYPING_STOP, onTypingStop);
    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, onNotificationNew);
    socket.on(SOCKET_EVENTS.NOTIFICATION_READ, onNotificationRead);
    socket.on(SOCKET_EVENTS.NOTIFICATION_CLEAR, onNotificationClear);

    // Warm up caches on connect
    void friends.loadAll?.();
    void chat.loadConversations?.();
    void useNotificationStore.getState().refreshUnread();

    return () => {
      socket.off(SOCKET_EVENTS.FRIEND_REQUEST_NEW, onFriendRequestNew);
      socket.off(SOCKET_EVENTS.FRIEND_REQUEST_ACCEPTED, onFriendRequestAccepted);
      socket.off(SOCKET_EVENTS.FRIEND_REQUEST_REJECTED, onFriendRequestRejected);
      socket.off(SOCKET_EVENTS.FRIEND_REMOVED, onFriendRemoved);
      socket.off(SOCKET_EVENTS.FRIEND_ONLINE, onPresence);
      socket.off(SOCKET_EVENTS.FRIEND_OFFLINE, onPresence);
      socket.off(SOCKET_EVENTS.STATUS_UPDATE, onPresence);
      socket.off(SOCKET_EVENTS.MESSAGE_RECEIVE, onMessageReceive);
      socket.off(SOCKET_EVENTS.MESSAGE_EDIT, onMessageEdit);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETE, onMessageDelete);
      socket.off(SOCKET_EVENTS.MESSAGE_SEEN, onSeen);
      socket.off(SOCKET_EVENTS.CONVERSATION_UPDATE, onConversationUpdate);
      socket.off(SOCKET_EVENTS.TYPING_START, onTypingStart);
      socket.off(SOCKET_EVENTS.TYPING_STOP, onTypingStop);
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, onNotificationNew);
      socket.off(SOCKET_EVENTS.NOTIFICATION_READ, onNotificationRead);
      socket.off(SOCKET_EVENTS.NOTIFICATION_CLEAR, onNotificationClear);
    };
  }, [isAuthenticated, user]);
}

export function emitTyping(conversationId: string, toUserId: string, isTyping: boolean) {
  const socket = getSocket();
  if (!socket.connected) return;
  socket.emit(isTyping ? SOCKET_EVENTS.TYPING_START : SOCKET_EVENTS.TYPING_STOP, {
    conversationId,
    toUserId,
  });
}
