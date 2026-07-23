import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface Props {
  user: Pick<User, "displayName" | "username" | "avatarUrl" | "isOnline">;
  size?: "sm" | "md" | "lg";
  showPresence?: boolean;
  className?: string;
}

const SIZES = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-base" };

export function UserAvatar({ user, size = "md", showPresence, className }: Props) {
  const initials = (user.displayName || user.username || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className={cn("relative shrink-0", className)}>
      <Avatar className={SIZES[size]}>
        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.displayName} /> : null}
        <AvatarFallback className="bg-mesh text-primary-foreground font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      {showPresence && (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-background",
            user.isOnline ? "bg-emerald-500" : "bg-muted-foreground/50",
          )}
          aria-label={user.isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  );
}
