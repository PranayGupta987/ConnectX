import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function GradientBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-aurora",
        className,
      )}
    >
      <div className="absolute inset-0 grid-noise opacity-40" />
      <div
        className="absolute left-1/2 top-[-20%] h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-30 blur-3xl animate-float"
        style={{ background: "var(--gradient-primary)" }}
      />
    </div>
  );
}

export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("relative py-20 sm:py-28", className)}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}
