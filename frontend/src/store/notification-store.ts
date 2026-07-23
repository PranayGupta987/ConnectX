import { create } from "zustand";
import type { AppNotification } from "@/types";
import { notificationService } from "@/services/notification-service";

interface NotificationState {
  items: AppNotification[];
  unread: number;
  total: number;
  page: number;
  loading: boolean;
  hasMore: boolean;

  load: (opts?: { reset?: boolean }) => Promise<void>;
  refreshUnread: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;

  // realtime
  applyIncoming: (n: AppNotification) => void;
  applyRead: (payload: { id?: string; all?: boolean }) => void;
  applyCleared: (payload: { id?: string; all?: boolean }) => void;
}

const PAGE_SIZE = 20;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unread: 0,
  total: 0,
  page: 0,
  loading: false,
  hasMore: true,

  load: async ({ reset = false } = {}) => {
    if (get().loading) return;
    const nextPage = reset ? 1 : get().page + 1;
    set({ loading: true });
    try {
      const res = await notificationService.list({ page: nextPage, limit: PAGE_SIZE });
      set((s) => ({
        items: reset ? res.items : [...s.items, ...res.items],
        unread: res.unread,
        total: res.total,
        page: nextPage,
        hasMore: (reset ? res.items.length : s.items.length + res.items.length) < res.total,
      }));
    } finally {
      set({ loading: false });
    }
  },

  refreshUnread: async () => {
    try {
      const unread = await notificationService.unreadCount();
      set({ unread });
    } catch {
      /* non-fatal */
    }
  },

  markRead: async (id) => {
    // optimistic
    set((s) => ({
      items: s.items.map((n) => (n.id === id && !n.read ? { ...n, read: true } : n)),
      unread: Math.max(0, s.unread - (s.items.find((n) => n.id === id && !n.read) ? 1 : 0)),
    }));
    try {
      await notificationService.markRead(id);
    } catch {
      /* keep optimistic */
    }
  },

  markAllRead: async () => {
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })), unread: 0 }));
    try {
      await notificationService.markAllRead();
    } catch {
      /* keep optimistic */
    }
  },

  remove: async (id) => {
    const prev = get().items;
    set((s) => ({
      items: s.items.filter((n) => n.id !== id),
      unread: Math.max(0, s.unread - (prev.find((n) => n.id === id && !n.read) ? 1 : 0)),
      total: Math.max(0, s.total - 1),
    }));
    try {
      await notificationService.remove(id);
    } catch {
      set({ items: prev });
    }
  },

  clearAll: async () => {
    const prev = get().items;
    set({ items: [], unread: 0, total: 0, page: 0, hasMore: false });
    try {
      await notificationService.clearAll();
    } catch {
      set({ items: prev });
    }
  },

  applyIncoming: (n) => {
    set((s) => {
      if (s.items.some((x) => x.id === n.id)) return s;
      return {
        items: [n, ...s.items],
        unread: s.unread + (n.read ? 0 : 1),
        total: s.total + 1,
      };
    });
  },

  applyRead: ({ id, all }) => {
    set((s) => {
      if (all) return { items: s.items.map((n) => ({ ...n, read: true })), unread: 0 };
      if (!id) return s;
      const target = s.items.find((n) => n.id === id);
      const wasUnread = target && !target.read;
      return {
        items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
        unread: Math.max(0, s.unread - (wasUnread ? 1 : 0)),
      };
    });
  },

  applyCleared: ({ id, all }) => {
    set((s) => {
      if (all) return { items: [], unread: 0, total: 0 };
      if (!id) return s;
      const target = s.items.find((n) => n.id === id);
      const wasUnread = target && !target.read;
      return {
        items: s.items.filter((n) => n.id !== id),
        unread: Math.max(0, s.unread - (wasUnread ? 1 : 0)),
        total: Math.max(0, s.total - 1),
      };
    });
  },
}));
