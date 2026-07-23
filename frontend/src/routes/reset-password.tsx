import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import { AuthLayout } from "@/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { authService } from "@/services/auth-service";
import { toApiError } from "@/lib/api-client";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [
      { title: `Reset password — ${APP_NAME}` },
      { name: "description", content: `Set a new password for your ${APP_NAME} account.` },
      { property: "og:title", content: `Reset password — ${APP_NAME}` },
      { property: "og:description", content: `Set a new password for your ${APP_NAME} account.` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[0-9]/, "Include a number"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

type FormValues = z.infer<typeof schema>;

function ResetPasswordPage() {
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();
  const { token } = useSearch({ from: "/reset-password" });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      toast.error("Missing reset token. Request a new reset link.");
      return;
    }
    try {
      await authService.resetPassword({ token, password: values.password });
      toast.success("Password updated. Please sign in.");
      navigate({ to: ROUTES.LOGIN, replace: true });
    } catch (err) {
      const e = toApiError(err);
      if (e.fields?.password) setError("password", { message: e.fields.password });
      toast.error(e.message || "Could not update password");
    }
  };

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose something strong you don't use elsewhere."
      footer={
        <>
          Back to{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            sign in
          </Link>
        </>
      }
    >
      {!token ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          This reset link is missing a token. Please request a new one from the{" "}
          <Link to="/forgot-password" className="underline">forgot password</Link> page.
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPwd ? "text" : "password"}
                className="pr-10"
                placeholder="At least 8 characters, 1 uppercase, 1 number"
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
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input id="confirm" type={showPwd ? "text" : "password"} {...register("confirm")} />
            {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            Update password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
