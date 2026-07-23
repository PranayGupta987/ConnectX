import { useEffect, useRef } from "react";
import { Mic, MicOff, PhoneOff, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/common/user-avatar";
import { useCallController } from "@/hooks/use-webrtc";

/**
 * Full-screen ringing dialog shown when someone calls the current user.
 * Also handles the "outgoing / dialing" state on the caller side.
 */
export function IncomingCallDialog() {
  const { phase, active, acceptCall, rejectCall, hangUp, getLocalStream } = useCallController();
  const previewRef = useRef<HTMLVideoElement | null>(null);

  const isIncoming = phase === "incoming" && !!active;
  const isOutgoing = phase === "outgoing" && !!active;

  useEffect(() => {
    if (!isOutgoing || active?.type !== "video") return;
    const stream = getLocalStream();
    if (previewRef.current && stream) {
      previewRef.current.srcObject = stream;
    }
  }, [isOutgoing, active?.type, getLocalStream]);

  if (!active || (!isIncoming && !isOutgoing)) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-background/80 backdrop-blur-xl">
      <div className="glass-strong relative w-full max-w-sm rounded-3xl border border-border p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4">
          <UserAvatar user={active.peer} size="lg" showPresence={false} />
        </div>
        <div className="text-lg font-semibold">{active.peer.displayName}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          {isIncoming
            ? `Incoming ${active.type} call…`
            : `Calling · ${active.type === "video" ? "Video" : "Audio"}`}
        </div>

        {isOutgoing && active.type === "video" ? (
          <div className="mt-6 aspect-video overflow-hidden rounded-xl border border-border bg-black/60">
            <video ref={previewRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-center gap-6">
          {isIncoming ? (
            <>
              <Button
                type="button"
                onClick={rejectCall}
                aria-label="Reject call"
                className="h-14 w-14 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
              <Button
                type="button"
                onClick={acceptCall}
                aria-label="Accept call"
                className="h-14 w-14 rounded-full bg-emerald-500 text-white hover:bg-emerald-500/90"
              >
                {active.type === "video" ? <Phone className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={() => hangUp("cancel")}
              aria-label="Cancel call"
              className="h-14 w-14 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <MicOff className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
