import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { box: "h-7 w-7", icon: "h-4 w-4", text: "text-lg" },
  md: { box: "h-9 w-9", icon: "h-5 w-5", text: "text-xl" },
  lg: { box: "h-12 w-12", icon: "h-6 w-6", text: "text-2xl" },
};

export function Logo({ className, showWordmark = true, size = "md" }: LogoProps) {
  const s = sizes[size];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative grid place-items-center rounded-xl text-primary-foreground shadow-elegant",
          s.box,
        )}
        style={{ background: "var(--gradient-primary)" }}
      >
        <MessageCircle className={cn(s.icon, "stroke-[2.5]")} />
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success ring-2 ring-background animate-pulse-glow" />
      </div>
      {showWordmark && (
        <span className={cn("font-display font-bold tracking-tight", s.text)}>
          Connect<span className="gradient-text">X</span>
        </span>
      )}
    </div>
  );
}
