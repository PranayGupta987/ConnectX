import { create } from "zustand";
import type { FriendRequest, Paginated, SearchedUser, User } from "@/types";
import { friendService } from "@/services/friend-service";

interface FriendsState {
  friends: User[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
  loading: boolean;
  loadedAt: number | null;

  searchResults: SearchedUser[];
  searching: boolean;

  loadAll: () => Promise<void>;
  search: (q: string) => Promise<void>;
  clearSearch: () => void;

  sendRequest: (userId: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  removeFriend: (userId: string) => Promise<void>;

  // realtime hooks
  applyIncomingNew: (req: FriendRequest) => void;
  applyAccepted: (req: FriendRequest, currentUserId: string) => void;
  applyRejected: (req: FriendRequest) => void;
  applyFriendRemoved: (userId: string) => void;
  applyPresence: (userId: string, isOnline: boolean, lastSeen: string) => void;
}

function updateSearchResult(
  list: SearchedUser[],
  userId: string,
  patch: Partial<SearchedUser>,
): SearchedUser[] {
  return list.map((u) => (u.id === userId ? { ...u, ...patch } : u));
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],
  incoming: [],
  outgoing: [],
  loading: false,
  loadedAt: null,

  searchResults: [],
  searching: false,

  loadAll: async () => {
    set({ loading: true });
    try {
      const [friends, incoming, outgoing] = await Promise.all([
        friendService.listFriends(),
        friendService.listIncoming(),
        friendService.listOutgoing(),
      ]);
      set({
        friends: friends.items,
        incoming: incoming.items,
        outgoing: outgoing.items,
        loadedAt: Date.now(),
      });
    } finally {
      set({ loading: false });
    }
  },

  search: async (q: string) => {
    set({ searching: true });
    try {
      const res: Paginated<SearchedUser> = await friendService.search(q);
      set({ searchResults: res.items });
    } finally {
      set({ searching: false });
    }
  },

  clearSearch: () => set({ searchResults: [] }),

  sendRequest: async (userId) => {
    // optimistic
    set((s) => ({ searchResults: updateSearchResult(s.searchResults, userId, { relationship: "request_sent" }) }));
    try {
      const req = await friendService.sendRequest(userId);
      set((s) => ({ outgoing: [req, ...s.outgoing] }));
    } catch (err) {
      set((s) => ({ searchResults: updateSearchResult(s.searchResults, userId, { relationship: "none" }) }));
      throw err;
    }
  },

  cancelRequest: async (requestId) => {
    const prev = get().outgoing;
    const target = prev.find((r) => r.id === requestId);
    set({ outgoing: prev.filter((r) => r.id !== requestId) });
    if (target) {
      set((s) => ({
        searchResults: updateSearchResult(s.searchResults, target.receiver.id, { relationship: "none" }),
      }));
    }
    try {
      await friendService.cancel(requestId);
    } catch (err) {
      set({ outgoing: prev });
      throw err;
    }
  },

  acceptRequest: async (requestId) => {
    const prev = get().incoming;
    const target = prev.find((r) => r.id === requestId);
    set({ incoming: prev.filter((r) => r.id !== requestId) });
    try {
      const updated = await friendService.accept(requestId);
      if (target) {
        set((s) => ({
          friends: [updated.sender, ...s.friends.filter((f) => f.id !== updated.sender.id)],
        }));
      }
    } catch (err) {
      set({ incoming: prev });
      throw err;
    }
  },

  rejectRequest: async (requestId) => {
    const prev = get().incoming;
    set({ incoming: prev.filter((r) => r.id !== requestId) });
    try {
      await friendService.reject(requestId);
    } catch (err) {
      set({ incoming: prev });
      throw err;
    }
  },

  removeFriend: async (userId) => {
    const prev = get().friends;
    set({ friends: prev.filter((f) => f.id !== userId) });
    try {
      await friendService.remove(userId);
      set((s) => ({
        searchResults: updateSearchResult(s.searchResults, userId, { relationship: "none" }),
      }));
    } catch (err) {
      set({ friends: prev });
      throw err;
    }
  },

  applyIncomingNew: (req) => {
    set((s) =>
      s.incoming.some((r) => r.id === req.id) ? s : { incoming: [req, ...s.incoming] },
    );
  },

  applyAccepted: (req, currentUserId) => {
    const otherUser = req.sender.id === currentUserId ? req.receiver : req.sender;
    set((s) => ({
      friends: s.friends.some((f) => f.id === otherUser.id) ? s.friends : [otherUser, ...s.friends],
      outgoing: s.outgoing.filter((r) => r.id !== req.id),
      incoming: s.incoming.filter((r) => r.id !== req.id),
    }));
  },

  applyRejected: (req) => {
    set((s) => ({
      outgoing: s.outgoing.filter((r) => r.id !== req.id),
    }));
  },

  applyFriendRemoved: (userId) => {
    set((s) => ({ friends: s.friends.filter((f) => f.id !== userId) }));
  },

  applyPresence: (userId, isOnline, lastSeen) => {
    set((s) => ({
      friends: s.friends.map((f) => (f.id === userId ? { ...f, isOnline, lastSeen } : f)),
    }));
  },
}));
