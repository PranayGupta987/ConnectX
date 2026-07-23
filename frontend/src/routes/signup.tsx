import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { APP_NAME, ROUTES } from "@/lib/constants";
import { authService } from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";
import { toApiError } from "@/lib/api-client";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: `Create your account — ${APP_NAME}` },
      { name: "description", content: `Join ${APP_NAME} and start chatting in minutes.` },
      { property: "og:title", content: `Create your ${APP_NAME} account` },
      { property: "og:description", content: `Join ${APP_NAME} and start chatting in minutes.` },
    ],
  }),
  component: SignupPage,
});

const schema = z
  .object({
    displayName: z.string().trim().min(2, "Enter your name").max(60),
    username: z
      .string()
      .trim()
      .min(3, "At least 3 characters")
      .max(24, "At most 24 characters")
      .regex(/^[a-zA-Z0-9_.]+$/, "Letters, numbers, dot and underscore only"),
    email: z.string().trim().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[0-9]/, "Include a number"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

function SignupPage() {
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onBlur" });

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await authService.signup({
        email: values.email,
        password: values.password,
        username: values.username,
        displayName: values.displayName,
      });
      setAuth(res);
      toast.success("Account created — check your inbox to verify");
      navigate({ to: ROUTES.VERIFY_EMAIL });
    } catch (err) {
      const e = toApiError(err);
      if (e.fields) {
        for (const [k, v] of Object.entries(e.fields)) {
          setError(k as keyof FormValues, { message: v });
        }
      }
      toast.error(e.message || "Sign up failed");
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Two minutes and you're in."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Full name</Label>
            <Input id="displayName" placeholder="Ada Lovelace" autoComplete="name" {...register("displayName")} />
            {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="ada" autoComplete="username" {...register("username")} />
            {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@company.com" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPwd ? "text" : "password"}
              autoComplete="new-password"
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
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type={showPwd ? "text" : "password"} autoComplete="new-password" {...register("confirm")} />
          {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
        </div>

        <p className="text-xs text-muted-foreground">
          By creating an account you agree to our{" "}
          <a href="#" className="underline underline-offset-2 hover:text-foreground">Terms</a> and{" "}
          <a href="#" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</a>.
        </p>

        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : null}
          Create account
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => {
            window.location.href = authService.googleRedirectUrl();
          }}
        >
          Continue with Google
        </Button>
      </form>
    </AuthLayout>
  );
}
