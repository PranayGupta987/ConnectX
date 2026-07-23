import { CallOverlay } from "./call-overlay";
import { IncomingCallDialog } from "./incoming-call-dialog";

/**
 * Mounts the WebRTC controller (via its child components) globally.
 * Both children call `useCallController` which sets up the socket listeners
 * exactly once via a shared Zustand store, so mounting both is safe.
 */
export function CallProvider() {
  return (
    <>
      <IncomingCallDialog />
      <CallOverlay />
    </>
  );
}
