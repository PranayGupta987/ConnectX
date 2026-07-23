import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { APP_NAME, ROUTES, STORAGE_KEYS } from "@/lib/constants";
import { authService } from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";

/**
 * Landing page for the server-side Google OAuth redirect flow.
 * The Express backend redirects here with `#access_token=...`; we persist the
 * token, load the current user, and forward the visitor to the dashboard.
 */
export const Route = createFileRoute("/auth/google/return")({
  head: () => ({
    meta: [
      { title: `Signing you in — ${APP_NAME}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GoogleReturnPage,
});

function GoogleReturnPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash;
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const errParam = params.get("error");
        if (errParam) throw new Error(errParam);
        if (!accessToken) throw new Error("Missing access token from Google");

        window.localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        // Clear the fragment so the token never lingers in history.
        window.history.replaceState(null, "", window.location.pathname);

        const user = await authService.me();
        if (cancelled) return;
        setUser(user);
        toast.success(`Signed in as ${user.displayName.split(" ")[0]}`);
        navigate({ to: ROUTES.DASHBOARD, replace: true });
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Google sign-in failed";
        setError(msg);
        toast.error(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, setUser]);

  return (
    <AuthLayout title={error ? "Sign-in failed" : "Finishing sign-in"}>
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        {error ? (
          <>
            <div className="grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="h-8 w-8" />
            </div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="hero" size="lg" onClick={() => navigate({ to: ROUTES.LOGIN, replace: true })}>
              Back to sign in
            </Button>
          </>
        ) : (
          <>
            <div className="grid h-16 w-16 place-items-center rounded-full glass text-primary">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground">Signing you into ConnectX…</p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
