import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Logo } from "@/components/brand/logo";
import { GradientBackdrop } from "@/components/common/decorative";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <GradientBackdrop />
      <header className="flex items-center justify-between p-6">
        <Link to="/" aria-label="Home">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md"
        >
          <div className="glass-strong rounded-3xl border border-border p-8 shadow-elegant sm:p-10">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
          </div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </motion.div>
      </main>
    </div>
  );
}
