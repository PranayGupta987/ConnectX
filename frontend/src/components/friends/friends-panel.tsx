import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, Check, X, Clock, UserMinus, MessageCircle, Phone, Video } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ListSkeleton } from "@/components/common/skeletons";
import { UserAvatar } from "@/components/common/user-avatar";
import { useFriendsStore } from "@/store/friends-store";
import { useCallController } from "@/hooks/use-webrtc";
import { useChatStore } from "@/store/chat-store";
import { toApiError } from "@/lib/api-client";
import { ROUTES } from "@/lib/constants";
import type { FriendRequest, SearchedUser, User } from "@/types";

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function FriendsPanel() {
  const navigate = useNavigate();
  const {
    friends,
    incoming,
    outgoing,
    loading,
    loadAll,
    search,
    searchResults,
    searching,
    clearSearch,
    sendRequest,
    cancelRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
  } = useFriendsStore();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 300);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (debouncedQuery.trim().length === 0) {
      clearSearch();
      return;
    }
    void search(debouncedQuery.trim());
  }, [debouncedQuery, search, clearSearch]);

  const openChatWith = async (userId: string) => {
    try {
      const convo = await useChatStore.getState().openWithUser(userId);
      await navigate({ to: ROUTES.CHAT, search: { c: convo.id } as never });
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  const isSearching = debouncedQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Friends</h1>
          <p className="text-sm text-muted-foreground">
            Manage your connections, invites, and requests.
          </p>
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, username or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {isSearching ? (
        <SearchResults
          results={searchResults}
          loading={searching}
          onSend={(id) =>
            sendRequest(id).catch((err) => toast.error(toApiError(err).message))
          }
          onCancelByUser={(uid) => {
            const req = outgoing.find((r) => r.receiver.id === uid);
            if (req) cancelRequest(req.id).catch((err) => toast.error(toApiError(err).message));
          }}
          onOpenChat={openChatWith}
        />
      ) : (
        <Tabs defaultValue="friends" className="w-full">
          <TabsList>
            <TabsTrigger value="friends">
              Friends
              <Badge variant="secondary" className="ml-2">
                {friends.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="incoming">
              Requests
              {incoming.length > 0 && (
                <Badge className="ml-2" variant="destructive">
                  {incoming.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing">
              Sent
              <Badge variant="secondary" className="ml-2">
                {outgoing.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-6">
            {loading && friends.length === 0 ? (
              <ListSkeleton rows={5} />
            ) : friends.length === 0 ? (
              <EmptyState
                icon={<UserPlus className="h-6 w-6" />}
                title="No friends yet"
                hint="Search for people by username or email to send your first request."
              />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {friends.map((f) => (
                  <FriendCard
                    key={f.id}
                    user={f}
                    onChat={() => openChatWith(f.id)}
                    onRemove={() =>
                      removeFriend(f.id)
                        .then(() => toast.success(`Removed ${f.displayName}`))
                        .catch((err) => toast.error(toApiError(err).message))
                    }
                  />
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="incoming" className="mt-6">
            {loading && incoming.length === 0 ? (
              <ListSkeleton rows={3} />
            ) : incoming.length === 0 ? (
              <EmptyState
                icon={<Clock className="h-6 w-6" />}
                title="No pending requests"
                hint="You'll see invites here when someone wants to connect."
              />
            ) : (
              <ul className="space-y-3">
                {incoming.map((r) => (
                  <RequestRow
                    key={r.id}
                    request={r}
                    direction="incoming"
                    onAccept={() =>
                      acceptRequest(r.id)
                        .then(() => toast.success(`You are now friends with ${r.sender.displayName}`))
                        .catch((err) => toast.error(toApiError(err).message))
                    }
                    onReject={() =>
                      rejectRequest(r.id).catch((err) => toast.error(toApiError(err).message))
                    }
                  />
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="outgoing" className="mt-6">
            {loading && outgoing.length === 0 ? (
              <ListSkeleton rows={3} />
            ) : outgoing.length === 0 ? (
              <EmptyState
                icon={<Clock className="h-6 w-6" />}
                title="No sent requests"
                hint="Search for someone above to send an invite."
              />
            ) : (
              <ul className="space-y-3">
                {outgoing.map((r) => (
                  <RequestRow
                    key={r.id}
                    request={r}
                    direction="outgoing"
                    onCancel={() =>
                      cancelRequest(r.id).catch((err) => toast.error(toApiError(err).message))
                    }
                  />
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="glass flex flex-col items-center justify-center rounded-2xl border border-border p-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 max-w-sm text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function FriendCard({
  user,
  onChat,
  onRemove,
}: {
  user: User;
  onChat: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="glass flex items-center gap-3 rounded-2xl border border-border p-4">
      <UserAvatar user={user} showPresence />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{user.displayName}</div>
        <div className="truncate text-xs text-muted-foreground">
          @{user.username} · {user.isOnline ? "Online" : "Offline"}
        </div>
      </div>
      <FriendCardActions user={user} onChat={onChat} onRemove={onRemove} />
    </li>
  );
}

function FriendCardActions({
  user,
  onChat,
  onRemove,
}: {
  user: User;
  onChat: () => void;
  onRemove: () => void;
}) {
  const { startCall, phase } = useCallController();
  const disabled = phase !== "idle";
  return (
    <div className="flex items-center gap-1">
      <Button
        size="icon"
        variant="ghost"
        aria-label={`Voice call ${user.displayName}`}
        disabled={disabled}
        onClick={() => void startCall(user, "audio")}
      >
        <Phone className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        aria-label={`Video call ${user.displayName}`}
        disabled={disabled}
        onClick={() => void startCall(user, "video")}
      >
        <Video className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="hero" onClick={onChat}>
        <MessageCircle className="h-4 w-4" />
        Chat
      </Button>
      <Button size="icon" variant="ghost" aria-label="Remove friend" onClick={onRemove}>
        <UserMinus className="h-4 w-4" />
      </Button>
    </div>
  );
}


function RequestRow({
  request,
  direction,
  onAccept,
  onReject,
  onCancel,
}: {
  request: FriendRequest;
  direction: "incoming" | "outgoing";
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
}) {
  const user = direction === "incoming" ? request.sender : request.receiver;
  return (
    <li className="glass flex items-center gap-3 rounded-2xl border border-border p-4">
      <UserAvatar user={user} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{user.displayName}</div>
        <div className="truncate text-xs text-muted-foreground">@{user.username}</div>
      </div>
      <div className="flex items-center gap-2">
        {direction === "incoming" ? (
          <>
            <Button size="sm" variant="hero" onClick={onAccept}>
              <Check className="h-4 w-4" />
              Accept
            </Button>
            <Button size="sm" variant="ghost" onClick={onReject}>
              <X className="h-4 w-4" />
              Decline
            </Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>
    </li>
  );
}

function SearchResults({
  results,
  loading,
  onSend,
  onCancelByUser,
  onOpenChat,
}: {
  results: SearchedUser[];
  loading: boolean;
  onSend: (userId: string) => void;
  onCancelByUser: (userId: string) => void;
  onOpenChat: (userId: string) => void;
}) {
  const grouped = useMemo(() => results, [results]);
  if (loading && grouped.length === 0) return <ListSkeleton rows={4} />;
  if (grouped.length === 0)
    return (
      <EmptyState
        icon={<Search className="h-6 w-6" />}
        title="No matches"
        hint="Try a different username, name, or email."
      />
    );
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {grouped.map((u) => (
        <li
          key={u.id}
          className="glass flex items-center gap-3 rounded-2xl border border-border p-4"
        >
          <UserAvatar user={u} showPresence />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{u.displayName}</div>
            <div className="truncate text-xs text-muted-foreground">@{u.username}</div>
          </div>
          {u.relationship === "friend" ? (
            <Button size="sm" variant="hero" onClick={() => onOpenChat(u.id)}>
              <MessageCircle className="h-4 w-4" />
              Chat
            </Button>
          ) : u.relationship === "request_sent" ? (
            <Button size="sm" variant="ghost" onClick={() => onCancelByUser(u.id)}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
          ) : u.relationship === "request_received" ? (
            <Badge variant="secondary">Check requests</Badge>
          ) : u.relationship === "blocked" ? (
            <Badge variant="destructive">Blocked</Badge>
          ) : (
            <Button size="sm" variant="hero" onClick={() => onSend(u.id)}>
              <UserPlus className="h-4 w-4" />
              Add
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
