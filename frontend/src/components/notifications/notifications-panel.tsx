import { useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/components/common/skeletons";
import { useNotificationStore } from "@/store/notification-store";
import { formatChatTimestamp } from "@/lib/time";
import { ROUTES } from "@/lib/constants";
import type { AppNotification } from "@/types";

export function NotificationsPanel() {
  const navigate = useNavigate();
  const { items, unread, total, loading, hasMore, load, markRead, markAllRead, remove, clearAll } =
    useNotificationStore();

  useEffect(() => {
    void load({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl border border-border glass">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Bell className="h-4 w-4 text-primary" />
            Notifications
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {total} total · {unread} unread
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={unread === 0}
            onClick={() => {
              void markAllRead();
              toast.success("All marked as read");
            }}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
            disabled={total === 0}
            onClick={() => {
              void clearAll();
              toast.success("Notifications cleared");
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all
          </Button>
        </div>
      </div>

      <div className="p-3">
        {loading && items.length === 0 ? (
          <ListSkeleton rows={6} />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bell className="h-6 w-6" />
            </div>
            <div className="text-sm font-semibold">You're all caught up</div>
            <div className="mt-1 max-w-sm text-xs text-muted-foreground">
              When friends message you, send requests, or interact with your account, you'll see updates here.
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {items.map((n) => (
              <Row
                key={n.id}
                n={n}
                onOpen={() => {
                  if (!n.read) void markRead(n.id);
                  route(n, navigate);
                }}
                onMarkRead={() => void markRead(n.id)}
                onDelete={() => void remove(n.id)}
              />
            ))}
          </ul>
        )}

        {hasMore && items.length > 0 && (
          <div className="mt-3 flex justify-center">
            <Button variant="outline" size="sm" disabled={loading} onClick={() => void load()}>
              {loading ? "Loading…" : "Load more"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  n,
  onOpen,
  onMarkRead,
  onDelete,
}: {
  n: AppNotification;
  onOpen: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  return (
    <li
      className={cn(
        "group flex items-start gap-3 p-3 transition-colors hover:bg-accent/40",
        !n.read && "bg-primary/[0.04]",
      )}
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {emoji(n.type)}
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 cursor-pointer text-left"
      >
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
      </button>
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        {!n.read && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMarkRead} aria-label="Mark as read">
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete} aria-label="Delete">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </li>
  );
}

function emoji(type: AppNotification["type"]) {
  switch (type) {
    case "friend_request":
    case "friend_accepted":
      return <span>👥</span>;
    case "new_message":
      return <span>💬</span>;
    case "ai_mention":
      return <span>✨</span>;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

function route(n: AppNotification, navigate: ReturnType<typeof useNavigate>) {
  const data = (n.data ?? {}) as { conversationId?: string };
  switch (n.type) {
    case "new_message":
      navigate(
        data.conversationId
          ? { to: ROUTES.CHAT, search: { c: data.conversationId } as never }
          : { to: ROUTES.CHAT },
      );
      return;
    case "friend_request":
    case "friend_accepted":
      navigate({ to: ROUTES.FRIENDS });
      return;
    default:
      break;
  }
}
