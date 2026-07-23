import { UserAvatar } from "@/components/common/user-avatar";
import type { User } from "@/types";

export function TypingIndicator({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <UserAvatar user={user} size="sm" />
      <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-2">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
      </div>
    </div>
  );
}
