import { useEffect, useRef, useState, useCallback } from 'react';

// ICE servers — STUN for same network, TURN for cross-network
// STUN: helps peers discover their public IP (free, no bandwidth cost)
// TURN: relays media when direct P2P fails (different networks, strict firewalls)
// openrelay.metered.ca provides free TURN — sufficient for college demos
const ICE_SERVERS = {
  iceServers: [
    // Google STUN servers — always try direct connection first
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Free TURN servers from OpenRelay — fallback for cross-network scenarios
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
};

export const useWebRTC = ({ socket, roomId, user }) => {
  const [localStream, setLocalStream]    = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [callActive, setCallActive]      = useState(false);
  const [micOn, setMicOn]                = useState(true);
  const [cameraOn, setCameraOn]          = useState(true);
  const [error, setError]                = useState('');

  const peerConnections = useRef({});
  const localStreamRef  = useRef(null);

  // ── Create peer connection ─────────────────────────────────
  const createPeerConnection = useCallback((targetSocketId, targetName) => {
    // Return existing connection if already created
    if (peerConnections.current[targetSocketId]) {
      return peerConnections.current[targetSocketId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc-ice-candidate', {
          candidate: event.candidate,
          targetSocketId,
        });
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams((prev) => ({
        ...prev,
        [targetSocketId]: { stream: remoteStream, name: targetName },
      }));
    };

    // Add all local tracks to this peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    peerConnections.current[targetSocketId] = pc;
    return pc;
  }, [socket]);

  // ── Close one peer connection ──────────────────────────────
  const closePeerConnection = useCallback((socketId) => {
    if (peerConnections.current[socketId]) {
      peerConnections.current[socketId].close();
      delete peerConnections.current[socketId];
    }
    setRemoteStreams((prev) => {
      const updated = { ...prev };
      delete updated[socketId];
      return updated;
    });
  }, []);

  // ── Start call ─────────────────────────────────────────────
  const startCall = useCallback(async () => {
    try {
      setError('');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setCallActive(true);
      setMicOn(true);
      setCameraOn(true);

      // Tell everyone in the room we are ready
      // This triggers existing members to initiate a connection TO us
      socket?.emit('webrtc-ready', {
        roomId,
        socketId: socket.id,
        name: user?.name,
      });

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Camera/microphone permission denied.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone found.');
      } else {
        setError('Could not access media: ' + err.message);
      }
    }
  }, [socket, roomId, user]);

  // ── End call ───────────────────────────────────────────────
  const endCall = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    Object.keys(peerConnections.current).forEach(closePeerConnection);

    setLocalStream(null);
    setRemoteStreams({});
    setCallActive(false);
    setMicOn(true);
    setCameraOn(true);

    socket?.emit('webrtc-leave-call', { roomId });
  }, [socket, roomId, closePeerConnection]);

  // ── Toggle mic ─────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setMicOn((prev) => !prev);
    }
  }, []);

  // ── Toggle camera — Bug 3 fix ──────────────────────────────
  // The fix: instead of just toggling track.enabled (which doesn't
  // trigger React re-render of the video element), we stop/restart
  // the video track entirely and create a new stream object.
  // React sees a new stream reference and re-renders the video tile.
  const toggleCamera = useCallback(async () => {
    if (!localStreamRef.current) return;

    const videoTracks = localStreamRef.current.getVideoTracks();

    if (cameraOn) {
      // Turn OFF — stop the video track
      videoTracks.forEach((track) => track.stop());
      setCameraOn(false);

      // Update state so VideoPanel shows avatar instead of video
      setLocalStream((prev) => {
        // Return same stream — video tile checks cameraOn state
        return prev;
      });

    } else {
      // Turn ON — get a fresh video track
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = newStream.getVideoTracks()[0];

        // Replace the old video track in the local stream
        localStreamRef.current.getVideoTracks().forEach((t) => {
          localStreamRef.current.removeTrack(t);
        });
        localStreamRef.current.addTrack(newVideoTrack);

        // Replace the track in ALL peer connections
        Object.values(peerConnections.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(newVideoTrack);
        });

        // Force React to re-render video element with new stream
        setLocalStream(new MediaStream([
          newVideoTrack,
          ...localStreamRef.current.getAudioTracks(),
        ]));

        setCameraOn(true);
      } catch (err) {
        setError('Could not restart camera: ' + err.message);
      }
    }
  }, [cameraOn]);

  // ── Socket events ──────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Bug 1 & 2 fix:
    // Someone just started their call — they broadcast webrtc-ready
    // If WE are already in a call, WE initiate the offer TO them
    // This handles both cases:
    //   - A starts first, B joins later → B broadcasts ready → A offers to B
    //   - B starts first, A joins later → A broadcasts ready → B offers to A
    socket.on('webrtc-user-ready', async ({ socketId, name }) => {
      // Only respond if we are already in an active call
      if (!localStreamRef.current) return;

      // We are already in call — initiate connection to the new person
      const pc = createPeerConnection(socketId, name);

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('webrtc-offer', {
          roomId,
          offer,
          targetSocketId: socketId,
        });
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    });

    // We received an offer — send back an answer
    socket.on('webrtc-offer', async ({ offer, fromSocketId, fromName }) => {
      if (!localStreamRef.current) return;

      const pc = createPeerConnection(fromSocketId, fromName);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc-answer', {
          answer,
          targetSocketId: fromSocketId,
        });
      } catch (err) {
        console.error('Error creating answer:', err);
      }
    });

    // Received answer — complete handshake
    socket.on('webrtc-answer', async ({ answer, fromSocketId }) => {
      const pc = peerConnections.current[fromSocketId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Error setting remote description:', err);
        }
      }
    });

    // Received ICE candidate
    socket.on('webrtc-ice-candidate', async ({ candidate, fromSocketId }) => {
      const pc = peerConnections.current[fromSocketId];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    });

    // Someone left the call
    socket.on('webrtc-user-left-call', ({ socketId }) => {
      closePeerConnection(socketId);
    });

    return () => {
      socket.off('webrtc-user-ready');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
      socket.off('webrtc-user-left-call');
    };
  }, [socket, roomId, createPeerConnection, closePeerConnection]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      Object.keys(peerConnections.current).forEach((id) => {
        if (peerConnections.current[id]) {
          peerConnections.current[id].close();
        }
      });
    };
  }, []);

  return {
    localStream,
    remoteStreams,
    callActive,
    micOn,
    cameraOn,
    error,
    startCall,
    endCall,
    toggleMic,
    toggleCamera,
  };
};