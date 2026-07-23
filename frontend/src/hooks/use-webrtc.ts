import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

import { ensureSocketConnected, getSocket } from "@/services/socket-service";
import { SOCKET_EVENTS, WEBRTC_ICE_SERVERS } from "@/lib/constants";
import { useCallStore } from "@/store/call-store";
import { useAuthStore } from "@/store/auth-store";
import type { CallRecord, CallType, User } from "@/types";

interface IncomingPayload {
  call: CallRecord;
}
interface SdpPayload {
  callId: string;
  sdp: RTCSessionDescriptionInit;
  from: string;
}
interface IcePayload {
  callId: string;
  candidate: RTCIceCandidateInit;
  from: string;
}
interface EndPayload {
  call: CallRecord;
  reason?: string;
}

// Module-level guard so signaling listeners install exactly once even if
// `useCallController` is mounted from multiple components simultaneously.
let signalingInstalled = false;


/**
 * Central WebRTC + signaling controller. Only one call is active at any
 * moment so we can keep peer connection state in refs.
 */
export function useCallController() {
  const currentUser = useAuthStore((s) => s.user);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const cameraVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteSetRef = useRef(false);
  const qualityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    phase,
    active,
    devices,
    setPhase,
    setActive,
    patchActive,
    setDevices,
    setLastEnded,
    reset,
  } = useCallStore();

  const stopMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    remoteStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenTrackRef.current?.stop();
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    screenTrackRef.current = null;
    cameraVideoTrackRef.current = null;
  }, []);

  const closePeer = useCallback(() => {
    if (qualityTimerRef.current) {
      clearInterval(qualityTimerRef.current);
      qualityTimerRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.onconnectionstatechange = null;
      try {
        pcRef.current.close();
      } catch {
        /* noop */
      }
      pcRef.current = null;
    }
    pendingIceRef.current = [];
    remoteSetRef.current = false;
  }, []);

  const teardown = useCallback(
    (endedRecord?: CallRecord | null) => {
      closePeer();
      stopMedia();
      if (endedRecord) setLastEnded(endedRecord);
      reset();
    },
    [closePeer, stopMedia, reset, setLastEnded],
  );

  // ---------------- Media capture ----------------

  const acquireLocalStream = useCallback(
    async (type: CallType) => {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video:
          type === "video"
            ? {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: devices.facing,
              }
            : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) cameraVideoTrackRef.current = videoTrack;
      return stream;
    },
    [devices.facing],
  );

  // ---------------- Peer setup ----------------

  const createPeer = useCallback(
    (callId: string, peerUserId: string) => {
      const pc = new RTCPeerConnection({ iceServers: WEBRTC_ICE_SERVERS });
      pcRef.current = pc;
      remoteStreamRef.current = new MediaStream();

      pc.onicecandidate = (evt) => {
        if (evt.candidate) {
          const socket = getSocket();
          socket.emit(SOCKET_EVENTS.CALL_ICE, {
            toUserId: peerUserId,
            callId,
            candidate: evt.candidate.toJSON(),
          });
        }
      };

      pc.ontrack = (evt) => {
        evt.streams[0]?.getTracks().forEach((t) => remoteStreamRef.current?.addTrack(t));
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === "connected") {
          patchActive({ reconnecting: false });
        } else if (state === "disconnected" || state === "failed") {
          patchActive({ reconnecting: state === "disconnected", quality: "poor" });
          if (state === "failed") {
            toast.error("Connection failed");
            const activeCall = useCallStore.getState().active;
            if (activeCall) hangUp("failed");
          }
        }
      };

      // Basic quality sampling — RTT + packet loss on the outbound audio track.
      qualityTimerRef.current = setInterval(async () => {
        if (!pcRef.current) return;
        try {
          const stats = await pcRef.current.getStats();
          let rtt = 0;
          let lossRatio = 0;
          stats.forEach((r) => {
            if (r.type === "candidate-pair" && r.state === "succeeded" && "currentRoundTripTime" in r) {
              rtt = Math.max(rtt, ((r as unknown) as { currentRoundTripTime: number }).currentRoundTripTime);
            }
            if (r.type === "outbound-rtp" && "packetsLost" in r && "packetsSent" in r) {
              const rr = (r as unknown) as { packetsLost: number; packetsSent: number };
              if (rr.packetsSent > 0) lossRatio = rr.packetsLost / rr.packetsSent;
            }
          });
          let q: "good" | "fair" | "poor" = "good";
          if (rtt > 0.4 || lossRatio > 0.1) q = "poor";
          else if (rtt > 0.2 || lossRatio > 0.03) q = "fair";
          patchActive({ quality: q });
        } catch {
          /* noop */
        }
      }, 3000);

      return pc;
    },
    [patchActive],
  );

  const attachLocalTracks = useCallback((stream: MediaStream) => {
    if (!pcRef.current) return;
    stream.getTracks().forEach((track) => {
      pcRef.current?.addTrack(track, stream);
    });
  }, []);

  const drainPendingIce = useCallback(async () => {
    if (!pcRef.current) return;
    for (const c of pendingIceRef.current) {
      try {
        await pcRef.current.addIceCandidate(c);
      } catch {
        /* noop */
      }
    }
    pendingIceRef.current = [];
  }, []);

  // ---------------- Public actions ----------------

  const startCall = useCallback(
    async (peer: User, type: CallType) => {
      if (useCallStore.getState().phase !== "idle") {
        toast.error("You're already in a call");
        return;
      }
      let socket;
      try {
        socket = await ensureSocketConnected();
      } catch {
        toast.error("Can't reach the server. Make sure the backend is running.");
        return;
      }
      try {
        const stream = await acquireLocalStream(type);
        setPhase("outgoing");
        setActive({
          id: "pending",
          type,
          peer,
          isCaller: true,
          startedAt: Date.now(),
          connectedAt: null,
          reconnecting: false,
          quality: "unknown",
        });
        setDevices({ micOn: true, camOn: type === "video", screenSharing: false });

        socket.emit(
          SOCKET_EVENTS.CALL_INVITE,
          { toUserId: peer.id, type },
          async (ack: { ok: boolean; call?: CallRecord; error?: string }) => {
            if (!ack?.ok || !ack.call) {
              toast.error(ack?.error || "Could not start call");
              stream.getTracks().forEach((t) => t.stop());
              teardown();
              return;
            }
            const call = ack.call;
            setActive({
              id: call.id,
              type,
              peer,
              isCaller: true,
              startedAt: Date.now(),
              connectedAt: null,
              reconnecting: false,
              quality: "unknown",
            });
            createPeer(call.id, peer.id);
            attachLocalTracks(stream);
          },
        );
      } catch (err) {
        toast.error((err as Error).message || "Could not access camera / microphone");
        teardown();
      }
    },
    [acquireLocalStream, attachLocalTracks, createPeer, setActive, setDevices, setPhase, teardown],
  );

  const acceptCall = useCallback(async () => {
    const a = useCallStore.getState().active;
    if (!a || useCallStore.getState().phase !== "incoming") return;
    let socket;
    try {
      socket = await ensureSocketConnected();
    } catch {
      toast.error("Can't reach the server. Make sure the backend is running.");
      return;
    }
    try {
      const stream = await acquireLocalStream(a.type);
      setPhase("connecting");
      createPeer(a.id, a.peer.id);
      attachLocalTracks(stream);
      socket.emit(SOCKET_EVENTS.CALL_ACCEPT, { callId: a.id, toUserId: a.peer.id });
    } catch (err) {
      toast.error((err as Error).message || "Could not access camera / microphone");
      socket.emit(SOCKET_EVENTS.CALL_REJECT, { callId: a.id, toUserId: a.peer.id, reason: "failed" });
      teardown();
    }
  }, [acquireLocalStream, attachLocalTracks, createPeer, setPhase, teardown]);

  const rejectCall = useCallback(() => {
    const a = useCallStore.getState().active;
    if (!a) return;
    getSocket().emit(SOCKET_EVENTS.CALL_REJECT, { callId: a.id, toUserId: a.peer.id, reason: "reject" });
    teardown();
  }, [teardown]);

  const hangUp = useCallback(
    (reason?: string) => {
      const a = useCallStore.getState().active;
      const p = useCallStore.getState().phase;
      if (!a) return;
      const socket = getSocket();
      if (p === "outgoing") {
        socket.emit(SOCKET_EVENTS.CALL_CANCEL, { callId: a.id, toUserId: a.peer.id });
      } else {
        socket.emit(SOCKET_EVENTS.CALL_END, { callId: a.id, toUserId: a.peer.id, reason });
      }
      teardown();
    },
    [teardown],
  );

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setDevices({ micOn: track.enabled });
  }, [setDevices]);

  const toggleCam = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setDevices({ camOn: track.enabled });
  }, [setDevices]);

  const switchCamera = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream || !pcRef.current) return;
    const nextFacing: "user" | "environment" =
      useCallStore.getState().devices.facing === "user" ? "environment" : "user";
    try {
      const fresh = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: nextFacing } },
      });
      const newTrack = fresh.getVideoTracks()[0];
      const oldTrack = stream.getVideoTracks()[0];
      if (oldTrack) {
        stream.removeTrack(oldTrack);
        oldTrack.stop();
      }
      stream.addTrack(newTrack);
      cameraVideoTrackRef.current = newTrack;
      const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
      await sender?.replaceTrack(newTrack);
      setDevices({ facing: nextFacing });
    } catch {
      toast.error("Could not switch camera");
    }
  }, [setDevices]);

  const toggleScreenShare = useCallback(async () => {
    if (!pcRef.current) return;
    const state = useCallStore.getState().devices.screenSharing;
    if (state) {
      // stop sharing → restore camera
      const camTrack = cameraVideoTrackRef.current;
      const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
      if (camTrack && sender) await sender.replaceTrack(camTrack);
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
      setDevices({ screenSharing: false });
      return;
    }
    try {
      const media = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const track = media.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
      await sender?.replaceTrack(track);
      screenTrackRef.current = track;
      setDevices({ screenSharing: true });
      track.addEventListener("ended", () => {
        const restore = cameraVideoTrackRef.current;
        const s = pcRef.current?.getSenders().find((x) => x.track?.kind === "video");
        if (restore && s) void s.replaceTrack(restore);
        setDevices({ screenSharing: false });
      });
    } catch {
      toast.error("Screen share cancelled");
    }
  }, [setDevices]);

  // ---------------- Signaling listeners (install once globally) ----------------

  useEffect(() => {
    if (!currentUser) return;
    if (signalingInstalled) return;
    signalingInstalled = true;
    const socket = getSocket();

    const onIncoming = ({ call }: IncomingPayload) => {
      if (useCallStore.getState().phase !== "idle") {
        socket.emit(SOCKET_EVENTS.CALL_REJECT, { callId: call.id, toUserId: call.caller.id, reason: "busy" });
        return;
      }
      setActive({
        id: call.id,
        type: call.type,
        peer: call.caller,
        isCaller: false,
        startedAt: Date.now(),
        connectedAt: null,
        reconnecting: false,
        quality: "unknown",
      });
      setPhase("incoming");
    };

    const onAccepted = async ({ call }: { call: CallRecord }) => {
      const a = useCallStore.getState().active;
      if (!a || a.id !== call.id) return;
      setPhase("connecting");
      const pc = pcRef.current;
      if (!pc) return;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit(SOCKET_EVENTS.CALL_OFFER, {
        toUserId: a.peer.id,
        callId: a.id,
        sdp: pc.localDescription,
      });
    };

    const onOffer = async ({ callId, sdp }: SdpPayload) => {
      const a = useCallStore.getState().active;
      if (!a || a.id !== callId) return;
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(sdp);
      remoteSetRef.current = true;
      await drainPendingIce();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit(SOCKET_EVENTS.CALL_ANSWER, {
        toUserId: a.peer.id,
        callId,
        sdp: pc.localDescription,
      });
      patchActive({ connectedAt: Date.now() });
      setPhase("in-call");
    };

    const onAnswer = async ({ callId, sdp }: SdpPayload) => {
      const a = useCallStore.getState().active;
      if (!a || a.id !== callId) return;
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(sdp);
      remoteSetRef.current = true;
      await drainPendingIce();
      patchActive({ connectedAt: Date.now() });
      setPhase("in-call");
    };

    const onIce = async ({ callId, candidate }: IcePayload) => {
      const a = useCallStore.getState().active;
      if (!a || a.id !== callId) return;
      const pc = pcRef.current;
      if (!pc) return;
      if (!remoteSetRef.current) {
        pendingIceRef.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        /* noop */
      }
    };

    const onRejected = ({ call }: EndPayload) => {
      toast.info(`${call.receiver.displayName} declined the call`);
      teardown(call);
    };
    const onCancelled = ({ call }: EndPayload) => {
      teardown(call);
    };
    const onEnded = ({ call }: EndPayload) => {
      teardown(call);
    };

    socket.on(SOCKET_EVENTS.CALL_INCOMING, onIncoming);
    socket.on(SOCKET_EVENTS.CALL_ACCEPTED, onAccepted);
    socket.on(SOCKET_EVENTS.CALL_OFFER, onOffer);
    socket.on(SOCKET_EVENTS.CALL_ANSWER, onAnswer);
    socket.on(SOCKET_EVENTS.CALL_ICE, onIce);
    socket.on(SOCKET_EVENTS.CALL_REJECTED, onRejected);
    socket.on(SOCKET_EVENTS.CALL_CANCELLED, onCancelled);
    socket.on(SOCKET_EVENTS.CALL_ENDED, onEnded);

    return () => {
      socket.off(SOCKET_EVENTS.CALL_INCOMING, onIncoming);
      socket.off(SOCKET_EVENTS.CALL_ACCEPTED, onAccepted);
      socket.off(SOCKET_EVENTS.CALL_OFFER, onOffer);
      socket.off(SOCKET_EVENTS.CALL_ANSWER, onAnswer);
      socket.off(SOCKET_EVENTS.CALL_ICE, onIce);
      socket.off(SOCKET_EVENTS.CALL_REJECTED, onRejected);
      socket.off(SOCKET_EVENTS.CALL_CANCELLED, onCancelled);
      socket.off(SOCKET_EVENTS.CALL_ENDED, onEnded);
      signalingInstalled = false;
    };
  }, [currentUser, drainPendingIce, patchActive, setActive, setPhase, teardown]);


  // Expose current streams via callbacks (consumers use refs)
  const getLocalStream = useCallback(() => localStreamRef.current, []);
  const getRemoteStream = useCallback(() => remoteStreamRef.current, []);

  return {
    phase,
    active,
    devices,
    startCall,
    acceptCall,
    rejectCall,
    hangUp,
    toggleMic,
    toggleCam,
    switchCamera,
    toggleScreenShare,
    getLocalStream,
    getRemoteStream,
  };
}
