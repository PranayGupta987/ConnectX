import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Video,
  Trash2,
  RefreshCcw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/common/user-avatar";
import { ListSkeleton } from "@/components/common/skeletons";
import { callService } from "@/services/call-service";
import { useCallController } from "@/hooks/use-webrtc";
import { useAuthStore } from "@/store/auth-store";
import { toApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { CallRecord } from "@/types";

export const Route = createFileRoute("/dashboard/calls")({
  component: CallsPage,
});

type Filter = "all" | "missed";

function formatDuration(sec: number) {
  if (!sec || sec <= 0) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function CallsPage() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { startCall, phase } = useCallController();

  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await callService.history({ limit: 50 });
      setCalls(page.items);
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () =>
      calls.filter((c) => (filter === "missed" ? c.status === "missed" : true)),
    [calls, filter],
  );

  const handleClear = async () => {
    if (!confirm("Delete all call history? This cannot be undone.")) return;
    setClearing(true);
    try {
      await callService.clear();
      setCalls([]);
      toast.success("Call history cleared");
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calls</h1>
          <p className="text-sm text-muted-foreground">Your recent voice and video calls.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCcw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={clearing || calls.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </header>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="missed">Missed</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="glass rounded-2xl border border-border">
        {loading ? (
          <div className="p-4">
            <ListSkeleton rows={6} />
          </div>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No calls to show yet.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((call) => {
              const isCaller = call.caller.id === currentUserId;
              const peer = isCaller ? call.receiver : call.caller;
              const missed = call.status === "missed";
              const rejected = call.status === "rejected";
              const isVideo = call.type === "video";

              const Icon = missed
                ? PhoneMissed
                : isCaller
                  ? PhoneOutgoing
                  : PhoneIncoming;

              return (
                <li key={call.id} className="flex items-center gap-4 p-4">
                  <UserAvatar user={peer} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{peer.displayName}</span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]",
                          missed || rejected
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {missed
                          ? "Missed"
                          : rejected
                            ? "Declined"
                            : isCaller
                              ? "Outgoing"
                              : "Incoming"}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {isVideo ? "Video" : "Voice"} ·{" "}
                      {formatDistanceToNow(new Date(call.startedAt), { addSuffix: true })}
                      {call.durationSec > 0 ? ` · ${formatDuration(call.durationSec)}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Call ${peer.displayName}`}
                      disabled={phase !== "idle"}
                      onClick={() => void startCall(peer, "audio")}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Video call ${peer.displayName}`}
                      disabled={phase !== "idle"}
                      onClick={() => void startCall(peer, "video")}
                    >
                      <Video className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
