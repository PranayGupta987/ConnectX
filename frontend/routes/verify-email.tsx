import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MailCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { authService } from "@/services/auth-service";
import { toApiError } from "@/lib/api-client";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [
      { title: `Verify your email — ${APP_NAME}` },
      { name: "description", content: `Confirm your email address to activate your ${APP_NAME} account.` },
      { property: "og:title", content: `Verify your email — ${APP_NAME}` },
      { property: "og:description", content: `Confirm your email address to activate your ${APP_NAME} account.` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyEmailPage,
});

type Status = "pending" | "verifying" | "success" | "error";

function VerifyEmailPage() {
  const navigate = useNavigate();
  const { token } = useSearch({ from: "/verify-email" });
  const [status, setStatus] = useState<Status>(token ? "verifying" : "pending");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        await authService.verifyEmail(token);
        if (cancelled) return;
        setStatus("success");
        toast.success("Email verified — you're all set");
        setTimeout(() => navigate({ to: ROUTES.DASHBOARD, replace: true }), 1500);
      } catch (err) {
        if (cancelled) return;
        const e = toApiError(err);
        setStatus("error");
        setErrorMsg(e.message || "Verification failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  return (
    <AuthLayout
      title={
        status === "success"
          ? "You're verified"
          : status === "error"
            ? "Verification failed"
            : "Verify your email"
      }
      footer={
        <>
          Wrong address?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Sign up again
          </Link>
        </>
      }
    >
      <div className="flex flex-col items-center gap-5 py-2 text-center">
        {status === "verifying" && (
          <>
            <div className="grid h-16 w-16 place-items-center rounded-full glass text-primary">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground">Verifying your email address…</p>
          </>
        )}

        {status === "pending" && (
          <>
            <div
              className="grid h-16 w-16 place-items-center rounded-full shadow-elegant text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <MailCheck className="h-7 w-7" />
            </div>
            <p className="text-sm text-muted-foreground">
              We just sent a verification link to your inbox. Click the link to activate your account —
              it expires in 24 hours.
            </p>
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Button asChild variant="outline" size="lg" className="flex-1">
                <Link to={ROUTES.LOGIN}>Back to sign in</Link>
              </Button>
              <Button asChild variant="hero" size="lg" className="flex-1">
                <Link to={ROUTES.DASHBOARD}>Continue</Link>
              </Button>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="text-sm text-muted-foreground">
              Your email is verified. Taking you to your workspace…
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="h-8 w-8" />
            </div>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Button asChild variant="outline" size="lg" className="flex-1">
                <Link to={ROUTES.LOGIN}>Back to sign in</Link>
              </Button>
              <Button asChild variant="hero" size="lg" className="flex-1">
                <Link to={ROUTES.SIGNUP}>Sign up again</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
