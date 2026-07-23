import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { tokenStorage } from "@/lib/api-client";
import { authService, type AuthResponse } from "@/services/auth-service";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** True after the app has attempted to restore a session on load. */
  initialized: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setAuth: (payload: AuthResponse) => void;
  setLoading: (v: boolean) => void;
  /** Restore session from persisted tokens by calling /auth/me. Idempotent. */
  initialize: () => Promise<void>;
  /** Best-effort server logout + local cleanup. */
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      initialized: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setAuth: ({ user, accessToken, refreshToken }) => {
        tokenStorage.set(accessToken, refreshToken);
        set({ user, isAuthenticated: true });
      },

      setLoading: (isLoading) => set({ isLoading }),

      initialize: async () => {
        if (get().initialized) return;
        const token = tokenStorage.getAccess();
        if (!token) {
          set({ initialized: true, isAuthenticated: false, user: null });
          return;
        }
        try {
          const user = await authService.me();
          set({ user, isAuthenticated: true, initialized: true });
        } catch {
          tokenStorage.clear();
          set({ user: null, isAuthenticated: false, initialized: true });
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          /* swallow — clean up regardless */
        }
        tokenStorage.clear();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "connectx.auth",
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    },
  ),
);

// Re-export storage keys for external consumers.
export const AUTH_STORAGE_KEY = STORAGE_KEYS;
