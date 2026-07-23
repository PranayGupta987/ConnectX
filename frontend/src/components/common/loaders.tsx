import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function Spinner({ className, size = 20 }: { className?: string; size?: number }) {
  return <Loader2 className={cn("animate-spin text-primary", className)} style={{ width: size, height: size }} />;
}

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="relative">
        <div className="absolute inset-0 rounded-full opacity-40 blur-2xl" style={{ background: "var(--gradient-primary)" }} />
        <Spinner size={36} className="relative" />
      </div>
      <p className="text-sm text-muted-foreground">{label}…</p>
    </div>
  );
}

export function InlineLoader({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Spinner size={14} />
      {label && <span>{label}</span>}
    </div>
  );
}
