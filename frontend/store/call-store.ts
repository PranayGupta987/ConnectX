import { create } from "zustand";
import type { CallRecord, CallType, User } from "@/types";

/**
 * UI-facing call phase. Backend `CallStatus` covers the persistence side; this
 * enum drives the overlay/incoming dialog.
 */
export type CallPhase =
  | "idle"
  | "outgoing" // I dialed, waiting for accept
  | "incoming" // Someone is ringing me
  | "connecting" // Both accepted, negotiating SDP/ICE
  | "in-call"; // Media is flowing

export type ConnectionQuality = "good" | "fair" | "poor" | "unknown";

export interface ActiveCall {
  id: string;
  type: CallType;
  peer: User; // the OTHER user
  isCaller: boolean;
  startedAt: number; // epoch ms (for outgoing/incoming)
  connectedAt: number | null;
  endReason?: string | null;
  reconnecting: boolean;
  quality: ConnectionQuality;
}

interface DeviceState {
  micOn: boolean;
  camOn: boolean;
  screenSharing: boolean;
  facing: "user" | "environment";
}

interface CallStoreState {
  phase: CallPhase;
  active: ActiveCall | null;
  devices: DeviceState;
  /** Last completed call summary for the "call ended" toast/dialog. */
  lastEnded: CallRecord | null;

  setPhase: (phase: CallPhase) => void;
  setActive: (active: ActiveCall | null) => void;
  patchActive: (patch: Partial<ActiveCall>) => void;
  setDevices: (patch: Partial<DeviceState>) => void;
  setLastEnded: (record: CallRecord | null) => void;
  reset: () => void;
}

const INITIAL_DEVICES: DeviceState = {
  micOn: true,
  camOn: true,
  screenSharing: false,
  facing: "user",
};

export const useCallStore = create<CallStoreState>((set) => ({
  phase: "idle",
  active: null,
  devices: INITIAL_DEVICES,
  lastEnded: null,

  setPhase: (phase) => set({ phase }),
  setActive: (active) => set({ active }),
  patchActive: (patch) =>
    set((s) => ({ active: s.active ? { ...s.active, ...patch } : s.active })),
  setDevices: (patch) => set((s) => ({ devices: { ...s.devices, ...patch } })),
  setLastEnded: (record) => set({ lastEnded: record }),
  reset: () =>
    set({
      phase: "idle",
      active: null,
      devices: { ...INITIAL_DEVICES },
    }),
}));
