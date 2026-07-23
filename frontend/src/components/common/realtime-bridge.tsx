import { useRealtimeSync } from "@/hooks/use-realtime-sync";

/** Invisible mount point that wires the socket bridge to the auth store. */
export function RealtimeBridge() {
  useRealtimeSync();
  return null;
}
