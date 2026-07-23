import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";

/**
 * Bootstraps the auth session on app load. Mounted once from the root route.
 * - Reads the persisted access token from localStorage.
 * - Calls /auth/me to hydrate the current user.
 * - On failure, clears tokens (auto-logout on invalid refresh token is handled
 *   inside the axios interceptor).
 */
export function AuthBootstrap() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return null;
}
