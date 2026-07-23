import { useNavigate } from "@tanstack/react-router";
import { Bell, Check, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListSkeleton } from "@/components/common/skeletons";
import { useNotificationStore } from "@/store/notification-store";
import { formatChatTimestamp } from "@/lib/time";
import { ROUTES } from "@/lib/constants";
import type { AppNotification } from "@/types";

export function NotificationBell() {
  const navigate = useNavigate();
  const { items, unread, loading, load, refreshUnread, markRead, markAllRead } =
    useNotificationStore();

  useEffect(() => {
    void refreshUnread();
  }, [refreshUnread]);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) void load({ reset: true });
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
          className="relative rounded-full"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full px-1 text-[10px]"
            >
              {unread > 99 ? "99+" : unread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="text-sm font-semibold">Notifications</div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={unread === 0}
              onClick={() => {
                void markAllRead();
                toast.success("All notifications marked as read");
              }}
              className="h-7 gap-1 px-2 text-xs"
            >
              <Check className="h-3 w-3" />
              Mark all read
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-[360px]">
          {loading && items.length === 0 ? (
            <div className="p-3">
              <ListSkeleton rows={4} />
            </div>
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="divide-y divide-border">
              {items.slice(0, 8).map((n) => (
                <NotificationRow
                  key={n.id}
                  n={n}
                  onClick={() => {
                    if (!n.read) void markRead(n.id);
                    routeFor(n, navigate);
                  }}
                />
              ))}
            </ul>
          )}
        </ScrollArea>

        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            className="w-full justify-center text-xs"
            onClick={() => navigate({ to: ROUTES.NOTIFICATIONS })}
          >
            View all
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Bell className="h-5 w-5" />
      </div>
      <div className="text-sm font-semibold">You're all caught up</div>
      <div className="mt-1 text-xs text-muted-foreground">
        New activity will show up here.
      </div>
    </div>
  );
}

function NotificationRow({
  n,
  onClick,
}: {
  n: AppNotification;
  onClick: () => void;
}) {
  const { remove } = useNotificationStore();
  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        className={cn(
          "group flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors hover:bg-accent/60",
          !n.read && "bg-primary/[0.04]",
        )}
      >
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {typeIcon(n.type)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-sm font-medium">{n.title}</div>
            {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
          </div>
          {n.body && (
            <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</div>
          )}
          <div className="mt-1 text-[10px] text-muted-foreground">
            {formatChatTimestamp(n.createdAt)}
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            void remove(n.id);
          }}
          aria-label="Delete notification"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </li>
  );
}

function typeIcon(type: AppNotification["type"]) {
  switch (type) {
    case "friend_request":
    case "friend_accepted":
      return <span aria-hidden>👥</span>;
    case "new_message":
      return <span aria-hidden>💬</span>;
    case "ai_mention":
      return <span aria-hidden>✨</span>;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

function routeFor(
  n: AppNotification,
  navigate: ReturnType<typeof useNavigate>,
) {
  const data = (n.data ?? {}) as { conversationId?: string };
  switch (n.type) {
    case "new_message":
      if (data.conversationId) {
        navigate({ to: ROUTES.CHAT, search: { c: data.conversationId } as never });
      } else {
        navigate({ to: ROUTES.CHAT });
      }
      return;
    case "friend_request":
    case "friend_accepted":
      navigate({ to: ROUTES.FRIENDS });
      return;
    default:
      navigate({ to: ROUTES.NOTIFICATIONS });
  }
}
