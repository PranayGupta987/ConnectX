import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MessageSquare, Users, Sparkles, Bell, UserPlus } from "lucide-react";
import { useEffect, useMemo } from "react";

import { ListSkeleton, CardSkeleton } from "@/components/common/skeletons";
import { UserAvatar } from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore, useChatStore, useFriendsStore, useNotificationStore } from "@/store";
import { formatChatTimestamp } from "@/lib/time";
import { ROUTES } from "@/lib/constants";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);

  const conversations = useChatStore((s) => s.conversations);
  const loadingConversations = useChatStore((s) => s.loadingList);
  const loadConversations = useChatStore((s) => s.loadConversations);

  const friends = useFriendsStore((s) => s.friends);
  const friendsLoadedAt = useFriendsStore((s) => s.loadedAt);
  const loadingFriends = useFriendsStore((s) => s.loading);
  const loadFriends = useFriendsStore((s) => s.loadAll);

  const unread = useNotificationStore((s) => s.unread);
  const refreshUnread = useNotificationStore((s) => s.refreshUnread);

  useEffect(() => {
    if (conversations.length === 0 && !loadingConversations) void loadConversations();
    if (friendsLoadedAt === null && !loadingFriends) void loadFriends();
    void refreshUnread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onlineFriendsCount = useMemo(() => friends.filter((f) => f.isOnline).length, [friends]);
  const activeChats = useMemo(
    () => conversations.filter((c) => c.lastMessageAt !== null).length,
    [conversations],
  );
  const weeklyActivity = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return conversations.filter((c) => {
      const t = c.lastMessageAt ? new Date(c.lastMessageAt).getTime() : 0;
      return t >= weekAgo;
    }).length;
  }, [conversations]);

  const stats = [
    { label: "Active chats", value: activeChats, icon: MessageSquare },
    { label: "Friends online", value: onlineFriendsCount, icon: Users },
    { label: "Unread alerts", value: unread, icon: Bell },
    { label: "Weekly activity", value: weeklyActivity, icon: Sparkles },
  ];

  const recentConversations = useMemo(
    () =>
      [...conversations]
        .filter((c) => c.lastMessageAt !== null)
        .sort(
          (a, b) =>
            new Date(b.lastMessageAt ?? b.updatedAt).getTime() -
            new Date(a.lastMessageAt ?? a.updatedAt).getTime(),
        )
        .slice(0, 5),
    [conversations],
  );

  const activeChatUserIds = useMemo(
    () => new Set(conversations.map((c) => c.otherUser?.id).filter(Boolean) as string[]),
    [conversations],
  );

  const suggestedFriends = useMemo(() => {
    const online = friends.filter((f) => f.isOnline && !activeChatUserIds.has(f.id));
    const rest = friends.filter((f) => !f.isOnline && !activeChatUserIds.has(f.id));
    return [...online, ...rest].slice(0, 3);
  }, [friends, activeChatUserIds]);

  const openConversation = (id: string) => {
    navigate({ to: ROUTES.CHAT, search: { c: id } });
  };

  const startChatWithFriend = async (userId: string) => {
    try {
      const convo = await useChatStore.getState().openWithUser(userId);
      navigate({ to: ROUTES.CHAT, search: { c: convo.id } });
    } catch {
      navigate({ to: ROUTES.CHAT });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome back{currentUser?.displayName ? `, ${currentUser.displayName.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's what's happening across your ConnectX workspace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass rounded-2xl border border-border p-5"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 font-display text-3xl font-bold">{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent activity</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: ROUTES.CHAT })}>
              View all
            </Button>
          </div>

          {loadingConversations && recentConversations.length === 0 ? (
            <ListSkeleton rows={5} />
          ) : recentConversations.length === 0 ? (
            <div className="glass rounded-2xl border border-border p-8 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No recent activity yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Start a conversation with a friend to see it here.
              </p>
              <Button size="sm" className="mt-4" onClick={() => navigate({ to: ROUTES.FRIENDS })}>
                Find friends
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentConversations.map((c) => {
                const other = c.otherUser;
                if (!other) return null;
                return (
                  <button
                    key={c.id}
                    onClick={() => openConversation(c.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left transition-colors hover:border-border hover:bg-accent/50 glass"
                  >
                    <UserAvatar user={other} size="md" showPresence />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {other.displayName || other.username}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatChatTimestamp(c.lastMessageAt)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-muted-foreground">
                          {c.lastMessagePreview || "No messages yet"}
                        </span>
                        {c.unreadCount > 0 && (
                          <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Suggested for you</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: ROUTES.FRIENDS })}>
              See all
            </Button>
          </div>

          {loadingFriends && suggestedFriends.length === 0 ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : suggestedFriends.length === 0 ? (
            <div className="glass rounded-2xl border border-border p-6 text-center">
              <UserPlus className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No suggestions right now</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Grow your network to see people to chat with.
              </p>
              <Button size="sm" className="mt-4" onClick={() => navigate({ to: ROUTES.FRIENDS })}>
                Discover people
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestedFriends.map((f) => (
                <div
                  key={f.id}
                  className="glass flex items-center gap-3 rounded-2xl border border-border p-4"
                >
                  <UserAvatar user={f} size="md" showPresence />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {f.displayName || f.username}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {f.isOnline ? "Online now" : "Say hello"}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => startChatWithFriend(f.id)}>
                    Message
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
