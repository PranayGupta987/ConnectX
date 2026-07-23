import { useEffect, useMemo, useRef, useState } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { MessageSquare, Search, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ListSkeleton } from "@/components/common/skeletons";
import { UserAvatar } from "@/components/common/user-avatar";
import { AIAvatar } from "@/components/ai/ai-avatar";
import { useChatStore } from "@/store/chat-store";
import { useAuthStore } from "@/store/auth-store";
import { formatChatTimestamp } from "@/lib/time";
import { ChatWindow } from "@/components/chat/chat-window";
import { AI_ASSISTANT, ROUTES } from "@/lib/constants";

export function ChatShell() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { c?: string };
  const activeId = search.c ?? null;

  const { conversations, loadingList, loadConversations, setActive, markSeen } = useChatStore();
  const { user } = useAuthStore();
  const [query, setQuery] = useState("");
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    setActive(activeId);
    if (activeId) void markSeen(activeId);
  }, [activeId, setActive, markSeen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      (c.otherUser?.displayName ?? "").toLowerCase().includes(q) ||
      (c.otherUser?.username ?? "").toLowerCase().includes(q),
    );
  }, [conversations, query]);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  return (
    <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
      <aside
        className={cn(
          "overflow-hidden rounded-2xl border border-border glass",
          activeId ? "hidden lg:block" : "block",
        )}
      >
        <div className="flex items-center gap-2 border-b border-border p-4">
          <MessageSquare className="h-4 w-4 text-primary" />
          <div className="text-sm font-semibold">Conversations</div>
        </div>
        <div className="p-3">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats…"
              className="pl-9"
            />
          </div>
          {/* Pinned ConnectX AI conversation */}
          <ul className="mb-2 space-y-1">
            <li>
              <button
                type="button"
                onClick={() => navigate({ to: ROUTES.AI })}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent/60"
              >
                <AIAvatar size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate text-sm font-semibold">
                      {AI_ASSISTANT.NAME}
                      <Sparkles className="h-3 w-3 text-primary" />
                    </div>
                    <div className="shrink-0 text-[10px] text-muted-foreground">Always on</div>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {AI_ASSISTANT.TAGLINE}
                  </div>
                </div>
              </button>
            </li>
          </ul>
          <div className="mb-2 h-px bg-border" />

          {loadingList && conversations.length === 0 ? (
            <ListSkeleton rows={6} />
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No conversations yet. Open a friend's chat from the Friends tab to start.
            </div>
          ) : (
            <ul className="space-y-1">
              {filtered.map((c) => {
                const other = c.otherUser;
                if (!other) return null;
                const isActive = c.id === activeId;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() =>
                        navigate({ to: ROUTES.CHAT, search: { c: c.id } as never })
                      }
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "hover:bg-accent/60",
                      )}
                    >
                      <UserAvatar user={other} showPresence />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-sm font-semibold">{other.displayName}</div>
                          <div className="shrink-0 text-[10px] text-muted-foreground">
                            {formatChatTimestamp(c.lastMessageAt)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-xs text-muted-foreground">
                            {c.lastMessagePreview || "Say hi 👋"}
                          </div>
                          {c.unreadCount > 0 && !isActive && (
                            <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px]">
                              {c.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section
        className={cn(
          "flex flex-col overflow-hidden rounded-2xl border border-border glass",
          !activeId && "hidden lg:flex",
        )}
      >
        {activeConversation && user ? (
          <ChatWindow
            conversation={activeConversation}
            currentUserId={user.id}
            onBack={() => navigate({ to: ROUTES.CHAT, search: {} as never })}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center">
            <div>
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div className="text-sm font-semibold">Select a conversation</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Or open a chat from your Friends list.
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
