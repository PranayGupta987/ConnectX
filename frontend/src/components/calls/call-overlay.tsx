import { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  MonitorX,
  SwitchCamera,
  Minimize2,
  Maximize2,
  SignalHigh,
  SignalMedium,
  SignalLow,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/common/user-avatar";
import { useCallController } from "@/hooks/use-webrtc";
import { cn } from "@/lib/utils";

function formatDuration(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = String(m).padStart(2, "0");
  const rr = String(r).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${rr}` : `${mm}:${rr}`;
}

export function CallOverlay() {
  const {
    phase,
    active,
    devices,
    hangUp,
    toggleMic,
    toggleCam,
    switchCamera,
    toggleScreenShare,
    getLocalStream,
    getRemoteStream,
  } = useCallController();

  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const visible = phase === "connecting" || phase === "in-call";

  useEffect(() => {
    if (!visible) return;
    
    // Set streams immediately if available
    const localStream = getLocalStream();
    const remoteStream = getRemoteStream();
    
    if (localRef.current) {
      localRef.current.srcObject = localStream;
      localRef.current.play().catch(() => {});
    }
    if (remoteRef.current) {
      remoteRef.current.srcObject = remoteStream;
      remoteRef.current.play().catch(() => {});
    }
    
    // Poll for streams if not yet available (handles async stream acquisition)
    const interval = setInterval(() => {
      const currentLocal = getLocalStream();
      const currentRemote = getRemoteStream();
      
      if (localRef.current && currentLocal && localRef.current.srcObject !== currentLocal) {
        localRef.current.srcObject = currentLocal;
        localRef.current.play().catch(() => {});
      }
      if (remoteRef.current && currentRemote && remoteRef.current.srcObject !== currentRemote) {
        remoteRef.current.srcObject = currentRemote;
        remoteRef.current.play().catch(() => {});
      }
      
      // Clear interval when both streams are set
      if (localRef.current?.srcObject && remoteRef.current?.srcObject) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [visible, getLocalStream, getRemoteStream, phase]);

  useEffect(() => {
    if (phase !== "in-call" || !active?.connectedAt) return;
    setElapsed(0);
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - (active.connectedAt as number)) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [phase, active?.connectedAt]);

  if (!visible || !active) return null;

  const isVideo = active.type === "video";
  const QualityIcon =
    active.quality === "poor" ? SignalLow : active.quality === "fair" ? SignalMedium : SignalHigh;

  return (
    <div
      className={cn(
        "fixed z-[70] transition-all",
        minimized
          ? "bottom-4 right-4 h-56 w-80 rounded-2xl shadow-2xl"
          : "inset-0 rounded-none",
      )}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[inherit] border border-border bg-black">
        {/* Remote video / avatar */}
        {isVideo ? (
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 via-slate-950 to-black">
            <UserAvatar user={active.peer} size="lg" showPresence={false} />
            <div className="text-center">
              <div className="text-xl font-semibold text-white">{active.peer.displayName}</div>
              <div className="mt-1 text-sm text-white/60">
                {phase === "connecting" ? "Connecting…" : "In call"}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <div className="pointer-events-auto glass-strong rounded-full border border-border px-3 py-1.5 text-sm text-white">
            <span className="font-medium">{active.peer.displayName}</span>
            <span className="mx-2 text-white/40">·</span>
            <span className="tabular-nums">
              {phase === "in-call" ? formatDuration(elapsed) : "Connecting…"}
            </span>
            {active.reconnecting ? (
              <span className="ml-2 text-amber-300">Reconnecting…</span>
            ) : null}
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <div
              className="glass-strong rounded-full border border-border p-2 text-white"
              aria-label={`Signal ${active.quality}`}
              title={`Connection: ${active.quality}`}
            >
              <QualityIcon className="h-4 w-4" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMinimized((m) => !m)}
              className="h-9 w-9 rounded-full glass-strong border border-border text-white hover:bg-white/10"
              aria-label={minimized ? "Expand call" : "Minimize call"}
            >
              {minimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Local preview (PiP) */}
        {isVideo && !minimized ? (
          <div className="absolute bottom-24 right-4 aspect-video w-40 overflow-hidden rounded-xl border border-white/20 bg-black/60 shadow-lg sm:w-56">
            <video
              ref={localRef}
              autoPlay
              muted
              playsInline
              className={cn("h-full w-full object-cover", !devices.camOn && "opacity-0")}
            />
            {!devices.camOn ? (
              <div className="absolute inset-0 grid place-items-center bg-black/70 text-xs text-white/70">
                Camera off
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Controls */}
        {!minimized ? (
          <div className="absolute inset-x-0 bottom-0 flex justify-center p-6">
            <div className="glass-strong flex items-center gap-3 rounded-full border border-border p-2">
              <ControlButton
                onClick={toggleMic}
                active={devices.micOn}
                aria-label={devices.micOn ? "Mute microphone" : "Unmute microphone"}
              >
                {devices.micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </ControlButton>

              {isVideo ? (
                <>
                  <ControlButton
                    onClick={toggleCam}
                    active={devices.camOn}
                    aria-label={devices.camOn ? "Turn camera off" : "Turn camera on"}
                  >
                    {devices.camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </ControlButton>
                  <ControlButton
                    onClick={switchCamera}
                    active
                    aria-label="Switch camera"
                  >
                    <SwitchCamera className="h-5 w-5" />
                  </ControlButton>
                </>
              ) : null}

              <ControlButton
                onClick={toggleScreenShare}
                active={devices.screenSharing}
                aria-label={devices.screenSharing ? "Stop sharing screen" : "Share screen"}
              >
                {devices.screenSharing ? (
                  <MonitorX className="h-5 w-5" />
                ) : (
                  <MonitorUp className="h-5 w-5" />
                )}
              </ControlButton>

              <Button
                type="button"
                onClick={() => hangUp("hangup")}
                aria-label="End call"
                className="h-12 w-12 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => hangUp("hangup")}
            className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90"
            aria-label="End call"
          >
            <PhoneOff className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function ControlButton({
  active,
  children,
  onClick,
  "aria-label": ariaLabel,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        "grid h-12 w-12 place-items-center rounded-full border border-transparent transition-colors",
        active
          ? "bg-white/10 text-white hover:bg-white/20"
          : "bg-white/5 text-white/60 hover:bg-white/10",
      )}
    >
      {children}
    </button>
  );
}
