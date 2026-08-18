import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from './SocketContext.jsx';
import toast from 'react-hot-toast';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2 } from 'lucide-react';

const CallContext = createContext(null);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export const CallProvider = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const socket = useSocket();

  // Call States: 'idle' | 'calling' | 'incoming' | 'connected' | 'ended'
  const [callState, setCallState] = useState('idle');
  const [callType, setCallType] = useState('video'); // 'audio' | 'video'
  const [targetUser, setTargetUser] = useState(null); // The other party (object with _id, name, avatar)
  const [callerUser, setCallerUser] = useState(null);

  // Audio / Video Control States
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Streams & Connection
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const callTimerRef = useRef(null);
  const durationRef = useRef(0);
  const iceServersRef = useRef([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]);

  // Fetch ICE / TURN configuration on mount
  useEffect(() => {
    const fetchIceConfig = async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${backendUrl}/config/turn-config`);
        const json = await res.json();
        if (json?.data?.iceServers?.length > 0) {
          iceServersRef.current = json.data.iceServers;
        }
      } catch (err) {
        console.warn('Could not fetch custom TURN config, using fallback STUN:', err);
      }
    };
    fetchIceConfig();
  }, []);

  // Cleanup helper
  const cleanUpCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const endCall = (status = 'completed') => {
    if (socket && targetUser?._id) {
      socket.emit('call_end', {
        toUserId: targetUser._id,
        fromUserId: user?._id,
        type: callType,
        duration: durationRef.current,
        status
      });
    }
    cleanUpCall();
    setCallState('ended');
    setTimeout(() => {
      setCallState('idle');
      setTargetUser(null);
      setCallerUser(null);
      durationRef.current = 0;
    }, 1500);
  };

  // Socket event listeners for call signaling
  useEffect(() => {
    if (!socket || !user?._id) return;

    // Incoming Call
    const handleIncomingCall = ({ caller, callerId, type }) => {
      if (callState !== 'idle') {
        socket.emit('call_reject', { callerId, calleeId: user._id, type });
        return;
      }
      setCallerUser(caller);
      setTargetUser(caller);
      setCallType(type);
      setCallState('incoming');
    };

    // Call Accepted
    const handleCallAccepted = async () => {
      setCallState('connected');
      durationRef.current = 0;
      callTimerRef.current = setInterval(() => {
        durationRef.current += 1;
      }, 1000);

      // Create WebRTC Offer
      try {
        if (pcRef.current) {
          const offer = await pcRef.current.createOffer();
          await pcRef.current.setLocalDescription(offer);
          socket.emit('webrtc_offer', { toUserId: targetUser._id, offer });
        }
      } catch (err) {
        toast.error('Failed to establish WebRTC connection');
        endCall('failed');
      }
    };

    // Call Rejected
    const handleCallRejected = () => {
      toast.error('Call was declined');
      endCall('rejected');
    };

    // Callee Unavailable
    const handleCallUnavailable = ({ reason }) => {
      toast.error(reason || 'User is offline');
      endCall('missed');
    };

    // Call Ended by other party
    const handleCallEnded = () => {
      toast('Call ended', { icon: '📞' });
      cleanUpCall();
      setCallState('ended');
      setTimeout(() => {
        setCallState('idle');
        setTargetUser(null);
        setCallerUser(null);
        durationRef.current = 0;
      }, 1500);
    };

    // WebRTC Offer Handler
    const handleWebRTCOffer = async ({ fromUserId, offer }) => {
      if (!pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit('webrtc_answer', { toUserId: fromUserId, answer });
      } catch (err) {
        console.error('Error handling WebRTC offer:', err);
      }
    };

    // WebRTC Answer Handler
    const handleWebRTCAnswer = async ({ answer }) => {
      if (!pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('Error handling WebRTC answer:', err);
      }
    };

    // WebRTC ICE Candidate Handler
    const handleWebRTCIceCandidate = async ({ candidate }) => {
      if (!pcRef.current || !candidate) return;
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    };

    socket.on('call_incoming', handleIncomingCall);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_unavailable', handleCallUnavailable);
    socket.on('call_ended', handleCallEnded);
    socket.on('webrtc_offer', handleWebRTCOffer);
    socket.on('webrtc_answer', handleWebRTCAnswer);
    socket.on('webrtc_ice_candidate', handleWebRTCIceCandidate);

    return () => {
      socket.off('call_incoming', handleIncomingCall);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_unavailable', handleCallUnavailable);
      socket.off('call_ended', handleCallEnded);
      socket.off('webrtc_offer', handleWebRTCOffer);
      socket.off('webrtc_answer', handleWebRTCAnswer);
      socket.off('webrtc_ice_candidate', handleWebRTCIceCandidate);
    };
  }, [socket, user?._id, callState, targetUser?._id, callType]);

  // Setup PeerConnection & Local Media
  const initPeerConnection = async (type, remoteUserId) => {
    try {
      const constraints = {
        audio: true,
        video: type === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
      pcRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Receive remote tracks
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      // Send ICE candidates to remote party
      pc.onicecandidate = (event) => {
        if (event.candidate && remoteUserId) {
          socket.emit('webrtc_ice_candidate', {
            toUserId: remoteUserId,
            candidate: event.candidate
          });
        }
      };

      return pc;
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('Camera/Microphone permission was denied. Please allow access in browser settings.');
      } else {
        toast.error('Could not access camera/microphone');
      }
      throw err;
    }
  };

  // Start outgoing call
  const startCall = async (partnerUser, type = 'video') => {
    if (!partnerUser || !socket) return;

    setTargetUser(partnerUser);
    setCallType(type);
    setCallState('calling');

    try {
      await initPeerConnection(type, partnerUser._id);
      socket.emit('call_initiate', {
        calleeId: partnerUser._id,
        callerId: user._id,
        type
      });
    } catch (err) {
      setCallState('idle');
      setTargetUser(null);
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!callerUser || !socket) return;
    try {
      await initPeerConnection(callType, callerUser._id);
      socket.emit('call_accept', {
        callerId: callerUser._id,
        calleeId: user._id
      });
      setCallState('connected');
      durationRef.current = 0;
      callTimerRef.current = setInterval(() => {
        durationRef.current += 1;
      }, 1000);
    } catch (err) {
      rejectCall();
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (callerUser && socket) {
      socket.emit('call_reject', {
        callerId: callerUser._id,
        calleeId: user._id,
        type: callType
      });
    }
    cleanUpCall();
    setCallState('idle');
    setCallerUser(null);
    setTargetUser(null);
  };

  // Toggle Mute Audio
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Video Track
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        targetUser,
        callerUser,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo
      }}
    >
      {children}
      <CallUIOverlay />
    </CallContext.Provider>
  );
};

const CallUIOverlay = () => {
  const {
    callState,
    callType,
    targetUser,
    callerUser,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callState === 'idle') return null;

  const displayUser = targetUser || callerUser;

  return (
    <>
      {/* 1. Incoming Call Modal (Global) */}
      {callState === 'incoming' && (
        <div className="fixed top-6 right-6 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl w-80 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3">
            <img
              src={displayUser?.avatar || 'https://res.cloudinary.com/demo/image/upload/v1571218039/sample.jpg'}
              alt={displayUser?.name}
              className="w-12 h-12 rounded-full object-cover border border-slate-300 dark:border-slate-700"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {displayUser?.name || 'Incoming Call'}
              </h4>
              <p className="text-xs text-brand-500 font-semibold capitalize flex items-center gap-1">
                {callType === 'video' ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                Incoming {callType} call...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={rejectCall}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <PhoneOff className="w-4 h-4" /> Decline
            </button>
            <button
              onClick={acceptCall}
              className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Phone className="w-4 h-4" /> Accept
            </button>
          </div>
        </div>
      )}

      {/* 2. Calling / Ringing State Screen */}
      {callState === 'calling' && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-200">
          <div className="relative mb-6">
            <img
              src={displayUser?.avatar || 'https://res.cloudinary.com/demo/image/upload/v1571218039/sample.jpg'}
              alt={displayUser?.name}
              className="w-28 h-28 rounded-full object-cover border-4 border-brand-500 shadow-2xl animate-pulse"
            />
          </div>
          <h2 className="text-xl font-extrabold">{displayUser?.name}</h2>
          <p className="text-xs text-slate-400 mt-1 animate-bounce">Ringing...</p>

          <div className="mt-10">
            <button
              onClick={() => endCall('missed')}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-transform hover:scale-105"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Connected In-Call Screen */}
      {callState === 'connected' && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-4 sm:p-6 text-white">
          {/* Main Video View (Remote or Audio Avatar) */}
          <div className="relative flex-1 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
            {callType === 'video' && remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3">
                <img
                  src={displayUser?.avatar || 'https://res.cloudinary.com/demo/image/upload/v1571218039/sample.jpg'}
                  alt={displayUser?.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-brand-500 shadow-2xl"
                />
                <h3 className="text-lg font-extrabold">{displayUser?.name}</h3>
                <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                  <Volume2 className="w-4 h-4 animate-pulse" /> Audio Call Connected
                </span>
              </div>
            )}

            {/* Self Video PIP (Picture-in-Picture) */}
            {callType === 'video' && localStream && (
              <div className="absolute bottom-4 right-4 w-32 sm:w-44 h-44 sm:h-56 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-black">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-xs text-slate-400">
                    Camera Off
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Call Controls Bar */}
          <div className="mt-4 flex items-center justify-center gap-4 py-3 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 max-w-md mx-auto w-full">
            <button
              onClick={toggleMute}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                  isVideoOff ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
                title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            )}

            <button
              onClick={() => endCall('completed')}
              className="w-12 h-12 rounded-2xl bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-lg"
              title="End Call"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Ended Banner */}
      {callState === 'ended' && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white border border-slate-800 rounded-2xl px-5 py-3 shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
          <PhoneOff className="w-4 h-4 text-red-500" /> Call Ended
        </div>
      )}
    </>
  );
};
