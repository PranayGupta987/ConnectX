import { create } from "zustand";
import type { Conversation, Message } from "@/types";
import { chatService } from "@/services/chat-service";

interface ChatState {
  conversations: Conversation[];
  activeId: string | null;

  messagesByConvo: Record<string, Message[]>;
  loadingMessages: Record<string, boolean>;
  hasMore: Record<string, boolean>;

  typingByConvo: Record<string, Record<string, number>>; // convoId → userId → expiresAt

  loadingList: boolean;

  loadConversations: () => Promise<void>;
  openWithUser: (userId: string) => Promise<Conversation>;
  setActive: (id: string | null) => void;

  loadMessages: (conversationId: string, opts?: { before?: string }) => Promise<void>;
  sendMessage: (
    conversationId: string,
    payload: { content?: string; replyTo?: string | null; image?: File | null },
  ) => Promise<void>;
  editMessage: (messageId: string, conversationId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string, conversationId: string) => Promise<void>;
  markSeen: (conversationId: string) => Promise<void>;

  // realtime
  applyIncomingMessage: (message: Message, conversation: Conversation, currentUserId: string) => void;
  applyMessageEdit: (message: Message) => void;
  applyMessageDelete: (payload: { id: string; conversationId: string }) => void;
  applyConversationUpdate: (conversation: Conversation) => void;
  applySeen: (payload: { conversationId: string; by: string; at: string }) => void;
  applyTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
}

function upsertConversation(list: Conversation[], convo: Conversation): Conversation[] {
  const filtered = list.filter((c) => c.id !== convo.id);
  return [convo, ...filtered].sort((a, b) => {
    const aTime = new Date(a.lastMessageAt ?? a.updatedAt).getTime();
    const bTime = new Date(b.lastMessageAt ?? b.updatedAt).getTime();
    return bTime - aTime;
  });
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeId: null,
  messagesByConvo: {},
  loadingMessages: {},
  hasMore: {},
  typingByConvo: {},
  loadingList: false,

  loadConversations: async () => {
    set({ loadingList: true });
    try {
      const res = await chatService.listConversations();
      set({ conversations: res.items });
    } finally {
      set({ loadingList: false });
    }
  },

  openWithUser: async (userId) => {
    const convo = await chatService.openConversation(userId);
    set((s) => ({ conversations: upsertConversation(s.conversations, convo), activeId: convo.id }));
    return convo;
  },

  setActive: (id) => set({ activeId: id }),

  loadMessages: async (conversationId, opts = {}) => {
    set((s) => ({ loadingMessages: { ...s.loadingMessages, [conversationId]: true } }));
    try {
      const msgs = await chatService.listMessages(conversationId, { before: opts.before, limit: 30 });
      set((s) => {
        const existing = s.messagesByConvo[conversationId] ?? [];
        const merged = opts.before ? [...msgs, ...existing] : msgs;
        // dedupe by id, preserve order
        const seen = new Set<string>();
        const deduped = merged.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
        return {
          messagesByConvo: { ...s.messagesByConvo, [conversationId]: deduped },
          hasMore: { ...s.hasMore, [conversationId]: msgs.length >= 30 },
        };
      });
    } finally {
      set((s) => ({ loadingMessages: { ...s.loadingMessages, [conversationId]: false } }));
    }
  },

  sendMessage: async (conversationId, payload) => {
    const { message, conversation } = await chatService.sendMessage(conversationId, payload);
    set((s) => ({
      messagesByConvo: {
        ...s.messagesByConvo,
        [conversationId]: [...(s.messagesByConvo[conversationId] ?? []), message],
      },
      conversations: upsertConversation(s.conversations, conversation),
    }));
  },

  editMessage: async (messageId, conversationId, content) => {
    const updated = await chatService.editMessage(messageId, content);
    set((s) => ({
      messagesByConvo: {
        ...s.messagesByConvo,
        [conversationId]: (s.messagesByConvo[conversationId] ?? []).map((m) =>
          m.id === messageId ? updated : m,
        ),
      },
    }));
  },

  deleteMessage: async (messageId, conversationId) => {
    await chatService.deleteMessage(messageId);
    set((s) => ({
      messagesByConvo: {
        ...s.messagesByConvo,
        [conversationId]: (s.messagesByConvo[conversationId] ?? []).map((m) =>
          m.id === messageId
            ? { ...m, deletedForEveryone: true, content: "", imageUrl: null }
            : m,
        ),
      },
    }));
  },

  markSeen: async (conversationId) => {
    try {
      await chatService.markSeen(conversationId);
    } catch {
      /* non-fatal */
    }
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    }));
  },

  applyIncomingMessage: (message, conversation, currentUserId) => {
    const activeId = get().activeId;
    set((s) => {
      const existing = s.messagesByConvo[conversation.id] ?? [];
      const alreadyPresent = existing.some((m) => m.id === message.id);
      const nextMessages = alreadyPresent ? existing : [...existing, message];
      const isActive = activeId === conversation.id;
      const patchedConvo: Conversation = {
        ...conversation,
        unreadCount: isActive ? 0 : conversation.unreadCount,
      };
      return {
        messagesByConvo: { ...s.messagesByConvo, [conversation.id]: nextMessages },
        conversations: upsertConversation(s.conversations, patchedConvo),
      };
    });
    if (activeId === conversation.id && message.sender.id !== currentUserId) {
      void get().markSeen(conversation.id);
    }
  },

  applyMessageEdit: (message) => {
    set((s) => ({
      messagesByConvo: {
        ...s.messagesByConvo,
        [message.conversation]: (s.messagesByConvo[message.conversation] ?? []).map((m) =>
          m.id === message.id ? message : m,
        ),
      },
    }));
  },

  applyMessageDelete: ({ id, conversationId }) => {
    set((s) => ({
      messagesByConvo: {
        ...s.messagesByConvo,
        [conversationId]: (s.messagesByConvo[conversationId] ?? []).map((m) =>
          m.id === id ? { ...m, deletedForEveryone: true, content: "", imageUrl: null } : m,
        ),
      },
    }));
  },

  applyConversationUpdate: (conversation) => {
    set((s) => ({ conversations: upsertConversation(s.conversations, conversation) }));
  },

  applySeen: ({ conversationId, by, at }) => {
    set((s) => ({
      messagesByConvo: {
        ...s.messagesByConvo,
        [conversationId]: (s.messagesByConvo[conversationId] ?? []).map((m) => {
          if (m.seenBy?.some((sb) => sb.user === by)) return m;
          return { ...m, seenBy: [...(m.seenBy ?? []), { user: by, at }] };
        }),
      },
    }));
  },

  applyTyping: (conversationId, userId, isTyping) => {
    set((s) => {
      const forConvo = { ...(s.typingByConvo[conversationId] ?? {}) };
      if (isTyping) forConvo[userId] = Date.now() + 4000;
      else delete forConvo[userId];
      return { typingByConvo: { ...s.typingByConvo, [conversationId]: forConvo } };
    });
  },
}));
