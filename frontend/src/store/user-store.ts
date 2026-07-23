import { create } from "zustand";
import type { User } from "@/types";

/**
 * Lightweight per-session user cache separate from auth state.
 * Useful when we need to reflect profile edits before refetching /users/me.
 */
interface UserState {
  profile: User | null;
  setProfile: (u: User | null) => void;
  patchProfile: (patch: Partial<User>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  patchProfile: (patch) =>
    set((s) => ({ profile: s.profile ? { ...s.profile, ...patch } : s.profile })),
}));
