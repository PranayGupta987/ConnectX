import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface Props {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

/**
 * ConnectX AI avatar. A distinctive gradient orb + spark icon so the AI
 * contact never gets confused with a real friend.
 */
export function AIAvatar({ size = "md", className }: Props) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full text-white shadow-md",
        SIZES[size],
        className,
      )}
      style={{ background: "var(--gradient-primary)" }}
      aria-label="ConnectX AI"
    >
      <Sparkles className="h-1/2 w-1/2" strokeWidth={2.25} />
      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
    </div>
  );
}
