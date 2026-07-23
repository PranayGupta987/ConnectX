import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { authService } from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";
import { toApiError } from "@/lib/api-client";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "",
  }),
  head: () => ({
    meta: [
      { title: `Sign in — ${APP_NAME}` },
      { name: "description", content: `Sign in to your ${APP_NAME} account.` },
      { property: "og:title", content: `Sign in — ${APP_NAME}` },
      { property: "og:description", content: `Sign in to your ${APP_NAME} account.` },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

function LoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await authService.login({ email: values.email, password: values.password });
      setAuth(res);
      toast.success(`Welcome back, ${res.user.displayName.split(" ")[0]}`);
      const target = search.redirect && search.redirect.startsWith("/") ? search.redirect : ROUTES.DASHBOARD;
      navigate({ to: target, replace: true });
    } catch (err) {
      const e = toApiError(err);
      if (e.fields) {
        for (const [k, v] of Object.entries(e.fields)) {
          setError(k as keyof FormValues, { message: v });
        }
      }
      toast.error(e.message || "Sign in failed");
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to ConnectX"
      footer={
        <>
          New here?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:text-foreground"
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="remember" defaultChecked {...register("remember")} />
          <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
            Keep me signed in
          </Label>
        </div>

        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          Sign in
        </Button>

        <div className="relative py-2">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
            or continue with
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => {
            window.location.href = authService.googleRedirectUrl();
          }}
        >
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 7.1 29.6 5 24 5 16 5 9.1 9.6 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.5l-6.6-5.4C29.5 34.6 26.9 35.5 24 35.5c-5.3 0-9.7-3.1-11.3-7.5l-6.6 5.1C9 39.6 15.9 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.3 5.4l6.6 5.4C41.1 35.4 44 30.1 44 24c0-1.2-.1-2.3-.4-3.5z" />
          </svg>
          Continue with Google
        </Button>
      </form>
    </AuthLayout>
  );
}
