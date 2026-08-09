import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiSlice } from '../../redux/api/apiSlice.js';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Send, ArrowLeft, Search, UserPlus, X, MessageSquare, CornerUpLeft, Paperclip, FileText, Download, Film, Image as ImageIcon, Phone, Video, Mic, Play, Pause, Square } from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import { useCall } from '../../context/CallContext.jsx';
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useGetUsersQuery,
  useToggleReactionMutation,
  useSendMessageMutation,
  useSendAttachmentMutation
} from '../../redux/api/messageApi.js';
import toast from 'react-hot-toast';

const VoicePlayer = ({ url, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 1;
      setProgress((cur / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setProgress(parseFloat(e.target.value));
    }
  };

  const fmtDur = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`flex items-center gap-3 p-2 rounded-2xl border ${
      isMe
        ? 'bg-brand-700/40 border-brand-400/30 text-white'
        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
    } min-w-[200px]`}>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); setProgress(0); }}
        preload="metadata"
      />
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
          isMe ? 'bg-white text-brand-600' : 'bg-brand-500 text-white'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className="w-full h-1 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
        />
        <div className="flex justify-between items-center text-[9px] opacity-70 mt-1">
          <span>{fmtDur(audioRef.current?.currentTime || 0)}</span>
          <span>{fmtDur(duration)}</span>
        </div>
      </div>
    </div>
  );
};

const AVATAR_COLORS = [
  'from-brand-600 to-indigo-600',
  'from-emerald-600 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-purple-600 to-pink-600',
  'from-rose-500 to-red-600'
];

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

const avatarColor = (id = '') =>
  AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];

const Avatar = ({ user, size = 10 }) => (
  <div
    className={`w-${size} h-${size} rounded-full bg-gradient-to-tr ${avatarColor(user?._id || '')} text-white flex items-center justify-center text-xs font-extrabold shrink-0`}
  >
    {user?.avatar
      ? <img src={user.avatar} alt={user.name} className={`w-${size} h-${size} rounded-full object-cover`} />
      : getInitials(user?.name)}
  </div>
);

const fmtTime = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export const Messages = () => {
  const { user } = useSelector((state) => state.auth);
  const socket = useSocket();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { startCall } = useCall();

  const [partner, setPartner] = useState(null);   // selected conversation partner
  const [liveMessages, setLiveMessages] = useState([]); // combined DB + socket messages
  const [text, setText] = useState('');
  const [showChat, setShowChat] = useState(false); // mobile toggle
  const [typing, setTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');

  // Handle direct navigation to a user chat (e.g. from UserProfile)
  useEffect(() => {
    if (location.state?.startChatWith) {
      const targetUser = location.state.startChatWith;
      setPartner(targetUser);
      setShowChat(true);
      setShowNewChat(false);
      // Clear route state to avoid re-triggering
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);
  
  // Message Reply & Reaction States
  const [replyingTo, setReplyingTo] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [showReactionPickerId, setShowReactionPickerId] = useState(null);

  // Gesture & Touch States
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const [activeSwipeMessageId, setActiveSwipeMessageId] = useState(null);
  const [swipeX, setSwipeX] = useState(0);
  const [gestureLock, setGestureLock] = useState(null); // 'scroll' | 'swipe' | null
  const [longPressedMessageId, setLongPressedMessageId] = useState(null);
  const longPressTimerRef = useRef(null);

  const handleTouchStart = (e, m) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setActiveSwipeMessageId(m._id);
    setSwipeX(0);
    setGestureLock(null);

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setLongPressedMessageId(m._id);
      setHoveredMessageId(m._id);
      
      // Auto reset scale feedback after a short pop duration
      setTimeout(() => {
        setLongPressedMessageId(null);
      }, 300);

      // Lock gesture so they don't scroll/swipe during active menu
      setGestureLock('scroll');
    }, 450);
  };

  const handleTouchMove = (e) => {
    if (e.touches.length !== 1 || !activeSwipeMessageId) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartPos.x;
    const diffY = touch.clientY - touchStartPos.y;

    // Clear long press if user moves finger significantly (scroll/swipe)
    if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    if (!gestureLock) {
      if (Math.abs(diffY) > Math.abs(diffX)) {
        setGestureLock('scroll');
      } else if (diffX > 8) {
        setGestureLock('swipe');
      }
    }

    if (gestureLock === 'swipe') {
      // Capped right-swipe translation
      const translation = Math.max(0, Math.min(diffX, 90));
      setSwipeX(translation);
    }
  };

  const handleTouchEnd = (e, m) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (gestureLock === 'swipe' && swipeX > 50) {
      setReplyingTo(m);
    }

    // Reset touch variables
    setActiveSwipeMessageId(null);
    setSwipeX(0);
    setGestureLock(null);
  };

  const typingTimer = useRef(null);
  const messagesEndRef = useRef(null);

  const [toggleReactionApi] = useToggleReactionMutation();
  const [sendMessageApi] = useSendMessageMutation();

  // API queries
  const { data: convData, refetch: refetchConvs } = useGetConversationsQuery(undefined, { pollingInterval: 10000 });
  const conversations = convData?.data || [];

  const { data: histData } = useGetMessagesQuery(partner?._id, {
    skip: !partner?._id,
    refetchOnMountOrArgChange: true
  });

  const { data: usersData } = useGetUsersQuery(userSearch, { skip: !showNewChat });
  const allUsers = usersData?.data || [];

  // Load history into live messages when partner changes
  useEffect(() => {
    if (histData?.data) {
      setLiveMessages(histData.data.map((m) => ({
        _id: m._id,
        text: m.text,
        attachments: m.attachments || [],
        isMe: m.sender._id === user?._id,
        sender: m.sender,
        parentMessage: m.parentMessage,
        reactions: m.reactions || [],
        createdAt: m.createdAt
      })));
    } else {
      setLiveMessages([]);
    }
  }, [histData, user?._id]);

  // Helper for reconciling incoming real message with existing live messages
  const reconcileOrAppendMessage = useCallback((prev, newMsg) => {
    // 1. Dedupe guard: Check if message with same _id already exists
    if (prev.some((m) => m._id === newMsg._id)) {
      return prev;
    }

    // 2. Reconciliation: check if there's a matching temp message to replace
    // Matching criteria: temp ID or matching text & sender (for current user)
    const tempIndex = prev.findIndex((m) => {
      const isTemp = typeof m._id === 'string' && m._id.startsWith('temp-');
      if (!isTemp) return false;
      if (newMsg.isMe && m.isMe) {
        return m.text === newMsg.text;
      }
      return false;
    });

    if (tempIndex !== -1) {
      const updated = [...prev];
      updated[tempIndex] = newMsg;
      return updated;
    }

    // 3. Otherwise append new message
    return [...prev, newMsg];
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveMessages, partnerTyping]);

  // Global click listener to clear message action menu state on tap outside
  useEffect(() => {
    const handleGlobalClick = () => {
      setHoveredMessageId(null);
      setShowReactionPickerId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Ref for refetchConvs to keep socket listeners stable without re-triggering effect
  const refetchConvsRef = useRef(refetchConvs);
  useEffect(() => {
    refetchConvsRef.current = refetchConvs;
  }, [refetchConvs]);

  // Socket events
  useEffect(() => {
    if (!socket || !user?._id) return;

    // Register as online
    socket.emit('user_online', user._id);

    socket.on('user_status', ({ userId, online }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    socket.on('receive_direct_message', (msg) => {
      // Only append if we're looking at the conversation with this sender
      setPartner((currentPartner) => {
        if (currentPartner && msg.sender?._id === currentPartner._id) {
          const incomingMsg = {
            _id: msg._id,
            text: msg.text,
            attachments: msg.attachments || [],
            isMe: msg.sender?._id === user?._id,
            sender: msg.sender,
            parentMessage: msg.parentMessage,
            reactions: msg.reactions || [],
            createdAt: msg.createdAt
          };
          setLiveMessages((prev) => reconcileOrAppendMessage(prev, incomingMsg));
        }
        return currentPartner;
      });
      // Refresh conversations sidebar
      refetchConvsRef.current?.();
      // Invalidate RTK cache for this convo
      dispatch(apiSlice.util.invalidateTags(['Message']));
    });

    socket.on('message_reaction_updated', ({ messageId, reactions }) => {
      setLiveMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    });

    socket.on('message_sent', (msg) => {
      if (msg) {
        setPartner((currentPartner) => {
          if (currentPartner && msg.recipient === currentPartner._id) {
            const confirmedMsg = {
              _id: msg._id,
              text: msg.text,
              attachments: msg.attachments || [],
              isMe: true,
              sender: msg.sender,
              parentMessage: msg.parentMessage,
              reactions: msg.reactions || [],
              createdAt: msg.createdAt,
              status: 'sent'
            };
            setLiveMessages((prev) => reconcileOrAppendMessage(prev, confirmedMsg));
          }
          return currentPartner;
        });
      }
      // Server ack — conversation update
      refetchConvsRef.current?.();
    });

    socket.on('user_typing', ({ senderName, typing: isTyping }) => {
      setPartnerTyping(isTyping);
    });

    return () => {
      socket.off('user_status');
      socket.off('receive_direct_message');
      socket.off('message_reaction_updated');
      socket.off('message_sent');
      socket.off('user_typing');
    };
  }, [socket, user?._id, dispatch, reconcileOrAppendMessage]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Voice Note Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const MAX_RECORDING_SEC = 180; // 3 minutes limit

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_SEC - 1) {
            stopAndSendRecording();
            return MAX_RECORDING_SEC;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('Microphone access was denied. Please allow access in browser settings.');
      } else {
        toast.error('Could not access microphone');
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingTime(0);
  };

  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current) return;

    const mr = mediaRecorderRef.current;
    mr.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      mr.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];

      if (audioBlob.size > 0) {
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
        await sendVoiceAttachment(audioFile);
      }
    };

    mr.stop();
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    setRecordingTime(0);
  };

  const sendVoiceAttachment = async (audioFile) => {
    if (!partner) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', audioFile);

    const tempId = `temp-${Date.now()}`;
    const tempAttachment = {
      url: URL.createObjectURL(audioFile),
      type: 'audio',
      fileName: audioFile.name,
      fileSize: audioFile.size
    };

    setLiveMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        text: '',
        attachments: [tempAttachment],
        isMe: true,
        sender: user,
        parentMessage: replyingTo ? { _id: replyingTo._id, text: replyingTo.text, sender: replyingTo.sender } : null,
        reactions: [],
        createdAt: new Date().toISOString(),
        status: 'sending'
      }
    ]);

    try {
      const res = await sendAttachmentApi({
        recipientId: partner._id,
        formData
      }).unwrap();

      setLiveMessages((prev) =>
        prev.map((m) =>
          m._id === tempId
            ? {
                _id: res.data._id,
                text: res.data.text,
                attachments: res.data.attachments,
                isMe: true,
                sender: res.data.sender,
                parentMessage: res.data.parentMessage,
                reactions: res.data.reactions || [],
                createdAt: res.data.createdAt,
                status: 'sent'
              }
            : m
        )
      );

      socket.emit('send_direct_message', {
        senderId: user._id,
        recipientId: partner._id,
        text: '',
        parentMessageId: replyingTo ? replyingTo._id : null,
        skipSave: true,
        messagePayload: res.data
      });
      toast.success('Voice message sent!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to upload voice message');
      setLiveMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...m, status: 'failed' } : m))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const [sendAttachmentApi] = useSendAttachmentMutation();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size limit validations: 100MB for video, 20MB for images & documents
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 100 * 1024 * 1024 : 20 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error(`File size exceeds limit (${isVideo ? '100MB' : '20MB'} max)`);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectPartner = (usr) => {
    setPartner(usr);
    setShowChat(true);
    setShowNewChat(false);
    setLiveMessages([]);
    setReplyingTo(null);
    clearSelectedFile();
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !selectedFile) || !partner || !socket || isUploading) return;

    if (selectedFile) {
      await handleSendAttachment();
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const messageText = text.trim();
    const parentMsg = replyingTo;

    // Optimistic UI
    setLiveMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        text: messageText,
        attachments: [],
        isMe: true,
        sender: user,
        parentMessage: parentMsg ? { _id: parentMsg._id, text: parentMsg.text, sender: parentMsg.sender } : null,
        reactions: [],
        createdAt: new Date().toISOString(),
        status: 'sending'
      }
    ]);

    setText('');
    setReplyingTo(null);
    stopTyping();

    try {
      const res = await sendMessageApi({
        recipientId: partner._id,
        text: messageText,
        parentMessageId: parentMsg ? parentMsg._id : null
      }).unwrap();

      setLiveMessages((prev) =>
        prev.map((m) =>
          m._id === tempId
            ? {
                _id: res.data._id,
                text: res.data.text,
                attachments: res.data.attachments || [],
                isMe: true,
                sender: res.data.sender,
                parentMessage: res.data.parentMessage,
                reactions: res.data.reactions || [],
                createdAt: res.data.createdAt,
                status: 'sent'
              }
            : m
        )
      );

      socket.emit('send_direct_message', {
        senderId: user._id,
        recipientId: partner._id,
        text: messageText,
        parentMessageId: parentMsg ? parentMsg._id : null,
        skipSave: true,
        messagePayload: res.data
      });
    } catch (err) {
      setLiveMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...m, status: 'failed' } : m))
      );
    }
  };

  const handleSendAttachment = async () => {
    if (!selectedFile || !partner) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (text.trim()) {
      formData.append('text', text.trim());
    }
    if (replyingTo) {
      formData.append('parentMessageId', replyingTo._id);
    }

    const tempId = `temp-${Date.now()}`;
    let attType = 'document';
    if (selectedFile.type.startsWith('image/')) attType = 'image';
    else if (selectedFile.type.startsWith('video/')) attType = 'video';

    // Optimistic message with local blob or filename preview
    const tempAttachment = {
      url: filePreview || '',
      type: attType,
      fileName: selectedFile.name,
      fileSize: selectedFile.size
    };

    setLiveMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        text: text.trim(),
        attachments: [tempAttachment],
        isMe: true,
        sender: user,
        parentMessage: replyingTo ? { _id: replyingTo._id, text: replyingTo.text, sender: replyingTo.sender } : null,
        reactions: [],
        createdAt: new Date().toISOString(),
        status: 'sending'
      }
    ]);

    const captionText = text.trim();
    setText('');
    setReplyingTo(null);
    clearSelectedFile();

    try {
      const res = await sendAttachmentApi({
        recipientId: partner._id,
        formData
      }).unwrap();

      setLiveMessages((prev) =>
        prev.map((m) =>
          m._id === tempId
            ? {
                _id: res.data._id,
                text: res.data.text,
                attachments: res.data.attachments,
                isMe: true,
                sender: res.data.sender,
                parentMessage: res.data.parentMessage,
                reactions: res.data.reactions || [],
                createdAt: res.data.createdAt,
                status: 'sent'
              }
            : m
        )
      );

      socket.emit('send_direct_message', {
        senderId: user._id,
        recipientId: partner._id,
        text: captionText,
        parentMessageId: replyingTo ? replyingTo._id : null,
        skipSave: true,
        messagePayload: res.data
      });
      toast.success('Attachment sent!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to upload attachment');
      setLiveMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...m, status: 'failed' } : m))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetry = async (failedMsg) => {
    // Set status back to 'sending'
    setLiveMessages((prev) =>
      prev.map((m) => (m._id === failedMsg._id ? { ...m, status: 'sending' } : m))
    );

    try {
      const res = await sendMessageApi({
        recipientId: partner._id,
        text: failedMsg.text,
        parentMessageId: failedMsg.parentMessage ? failedMsg.parentMessage._id : null
      }).unwrap();

      // Replace with database version on success
      setLiveMessages((prev) =>
        prev.map((m) =>
          m._id === failedMsg._id
            ? {
                _id: res.data._id,
                text: res.data.text,
                isMe: true,
                sender: res.data.sender,
                parentMessage: res.data.parentMessage,
                reactions: res.data.reactions || [],
                createdAt: res.data.createdAt,
                status: 'sent'
              }
            : m
        )
      );

      // Emit socket event with skipSave: true and messagePayload to deliver in real-time
      socket.emit('send_direct_message', {
        senderId: user._id,
        recipientId: partner._id,
        text: failedMsg.text,
        parentMessageId: failedMsg.parentMessage ? failedMsg.parentMessage._id : null,
        skipSave: true,
        messagePayload: res.data
      });

    } catch (err) {
      // Mark as failed again
      setLiveMessages((prev) =>
        prev.map((m) => (m._id === failedMsg._id ? { ...m, status: 'failed' } : m))
      );
    }
  };

  const handleToggleReaction = async (messageId, emoji) => {
    if (!socket || !partner) return;
    
    // Emit socket event for real-time broadcast
    socket.emit('message_reaction', {
      messageId,
      emoji,
      userId: user._id,
      recipientId: partner._id
    });

    // Close reaction picker
    setShowReactionPickerId(null);

    // Call fallback REST API mutation just in case of reconnection issues
    try {
      await toggleReactionApi({ messageId, emoji }).unwrap();
    } catch (err) {
      // Ignore API catch since socket will broadcast reaction
    }
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket || !partner) return;

    if (!typing) {
      setTyping(true);
      socket.emit('typing_start', { recipientId: partner._id, senderName: user?.name });
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 1500);
  };

  const stopTyping = useCallback(() => {
    if (typing && socket && partner) {
      socket.emit('typing_stop', { recipientId: partner._id });
    }
    setTyping(false);
  }, [typing, socket, partner]);

  const filteredConvs = conversations.filter((c) =>
    c.user?.name?.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const isOnline = (userId) => onlineUsers.has(userId);

  return (
    <div className="h-[calc(100vh-140px)] min-h-[500px]">
      <div className="flex h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">

        {/* ── Contacts Sidebar ─────────────────────────── */}
        <div className={`w-full sm:w-72 md:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 ${showChat ? 'hidden sm:flex' : 'flex'}`}>

          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Messages</h2>
              <button
                onClick={() => { setShowNewChat(true); setShowChat(true); }}
                className="p-1.5 rounded-xl text-brand-500 hover:bg-brand-500/10 transition-colors"
                title="New conversation"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredConvs.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-xs">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No conversations yet.</p>
                <button
                  onClick={() => { setShowNewChat(true); setShowChat(true); }}
                  className="mt-2 text-brand-500 hover:underline font-semibold"
                >
                  Start a new chat →
                </button>
              </div>
            )}
            {filteredConvs.map((conv) => (
              <button
                key={conv.user._id}
                onClick={() => handleSelectPartner(conv.user)}
                className={`w-full text-left p-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                  partner?._id === conv.user._id ? 'bg-brand-500/5 border-r-2 border-brand-500' : ''
                }`}
              >
                <div className="relative">
                  <Avatar user={conv.user} />
                  {isOnline(conv.user._id) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{conv.user.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-1">{fmtTime(conv.lastMessageAt)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] font-extrabold flex items-center justify-center shrink-0">
                    {conv.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Chat / New Chat Panel ─────────────────────── */}
        <div className={`flex-1 flex flex-col min-w-0 ${!showChat && !partner ? 'hidden sm:flex' : 'flex'}`}>

          {/* NEW CHAT: User Search */}
          {showNewChat && (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <button onClick={() => { setShowNewChat(false); setShowChat(false); }} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">New Conversation</h3>
                <button onClick={() => { setShowNewChat(false); setShowChat(!!partner); }} className="ml-auto p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl hidden sm:block">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search by name..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {allUsers.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => handleSelectPartner(u)}
                    className="w-full text-left p-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="relative">
                      <Avatar user={u} />
                      {isOnline(u._id) && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{u.name}</p>
                      <p className="text-[10px] text-slate-500">{u.role}</p>
                    </div>
                    {isOnline(u._id) && <span className="text-[10px] text-emerald-500 font-semibold">Online</span>}
                  </button>
                ))}
                {allUsers.length === 0 && userSearch && (
                  <p className="text-center text-xs text-slate-400 py-8">No users found</p>
                )}
              </div>
            </div>
          )}

          {/* CHAT VIEW */}
          {!showNewChat && partner && (
            <>
              {/* Chat header */}
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900">
                <button
                  onClick={() => { setShowChat(false); setPartner(null); }}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div
                  onClick={() => navigate(`/profile/${partner._id}`)}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-all"
                >
                  <div className="relative animate-fadeIn">
                    <Avatar user={partner} />
                    {isOnline(partner._id) && (
                      <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 hover:underline">{partner.name}</h3>
                    <p className={`text-[10px] font-semibold ${isOnline(partner._id) ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {partnerTyping ? '✍️ typing...' : isOnline(partner._id) ? 'Online' : 'Offline'}
                      {partner.role && ` • ${partner.role}`}
                    </p>
                  </div>
                </div>

                {/* Voice & Video Call Buttons */}
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => startCall(partner, 'audio')}
                    className="p-2 rounded-xl text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Audio call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startCall(partner, 'video')}
                    className="p-2 rounded-xl text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Video call"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
                {liveMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                    <MessageSquare className="w-8 h-8 opacity-30" />
                    <p className="text-xs">No messages yet. Say hi! 👋</p>
                  </div>
                )}
                {liveMessages.map((m) => (
                  <div
                    key={m._id}
                    onMouseEnter={() => setHoveredMessageId(m._id)}
                    onMouseLeave={() => { setHoveredMessageId(null); setShowReactionPickerId(null); }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setHoveredMessageId((prev) => (prev === m._id ? null : m._id));
                    }}
                    onTouchStart={(e) => handleTouchStart(e, m)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={(e) => handleTouchEnd(e, m)}
                    className={`flex relative group cursor-pointer sm:cursor-default ${m.isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Visual Swipe Reply Cue */}
                    {activeSwipeMessageId === m._id && swipeX > 10 && (
                      <div 
                        className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 pointer-events-none transition-opacity duration-150 ${
                          m.isMe ? 'left-[-40px]' : 'left-[8px]'
                        }`}
                        style={{ opacity: Math.min((swipeX - 10) / 40, 1) }}
                      >
                        <CornerUpLeft className="w-4 h-4" />
                      </div>
                    )}

                    <div 
                      className={`relative max-w-[70%] sm:max-w-sm transition-all duration-200 ${
                        longPressedMessageId === m._id ? 'scale-95 duration-100 shadow-lg' : ''
                      }`}
                      style={{
                        transform: activeSwipeMessageId === m._id ? `translateX(${swipeX}px)` : 'none',
                        transition: activeSwipeMessageId === m._id ? 'none' : 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                      }}
                    >
                      {/* Parent message reply reference */}
                      {m.parentMessage && (
                        <div className={`text-[10px] rounded-t-2xl px-3 py-1.5 border-l-2 opacity-80 ${
                          m.isMe
                            ? 'bg-brand-700/50 text-brand-100 border-brand-300'
                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 border-slate-400'
                        } truncate`}>
                          <span className="font-extrabold block text-[9px] uppercase tracking-wider opacity-90">
                            Replying to {m.parentMessage.sender?.name || 'User'}
                          </span>
                          "{m.parentMessage.text}"
                        </div>
                      )}

                      <div className={`shadow-sm px-3.5 py-2.5 transition-opacity duration-200 ${
                        m.status === 'sending'
                          ? 'opacity-60 bg-brand-700/80 text-brand-100 rounded-br-sm'
                          : m.status === 'failed'
                          ? 'opacity-85 border border-red-500/35 bg-red-500/10 text-red-700 dark:text-red-450 rounded-br-sm animate-pulse'
                          : m.isMe
                          ? 'bg-brand-600 text-white rounded-br-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm border border-slate-200 dark:border-slate-700'
                      } ${m.parentMessage ? 'rounded-b-2xl' : 'rounded-2xl'}`}>

                        {/* Attachments rendering */}
                        {m.attachments && m.attachments.length > 0 && (
                          <div className="space-y-2 mb-2">
                            {m.attachments.map((att, idx) => (
                              <div key={idx} className="rounded-xl overflow-hidden">
                                {att.type === 'image' && (
                                  <a href={att.url} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={att.url}
                                      alt={att.fileName || 'Attachment'}
                                      className="max-h-60 max-w-full rounded-xl object-cover hover:opacity-95 transition-opacity"
                                    />
                                  </a>
                                )}

                                {att.type === 'video' && (
                                  <video
                                    src={att.url}
                                    controls
                                    className="max-h-60 max-w-full rounded-xl object-cover"
                                  />
                                )}

                                {att.type === 'audio' && (
                                  <VoicePlayer url={att.url} isMe={m.isMe} />
                                )}

                                {att.type === 'document' && (
                                  <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={att.fileName || 'document'}
                                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors ${
                                      m.isMe
                                        ? 'bg-brand-700/40 border-brand-400/30 text-white hover:bg-brand-700/60'
                                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-200/70'
                                    }`}
                                  >
                                    <div className="p-2 rounded-lg bg-brand-500/20 text-brand-400 shrink-0">
                                      <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold truncate">{att.fileName || 'Document'}</p>
                                      {att.fileSize && (
                                        <p className="text-[9px] opacity-70">
                                          {(att.fileSize / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                      )}
                                    </div>
                                    <Download className="w-4 h-4 shrink-0 opacity-70 hover:opacity-100" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {m.text && <p className="text-xs leading-relaxed break-words">{m.text}</p>}
                        <p className={`text-[8px] mt-1 text-right ${
                          m.isMe && m.status !== 'failed'
                            ? 'text-indigo-200'
                            : m.status === 'failed'
                            ? 'text-red-400'
                            : 'text-slate-400'
                        }`}>
                          {fmtTime(m.createdAt)}
                        </p>
                      </div>

                      {m.isMe && m.status === 'sending' && (
                        <p className="text-[10px] text-slate-400 text-right mt-1 animate-pulse">
                          Sending...
                        </p>
                      )}
                      {m.isMe && m.status === 'failed' && (
                        <button
                          type="button"
                          onClick={() => handleRetry(m)}
                          className="text-[10px] text-red-500 font-extrabold flex items-center justify-end gap-1 mt-1 hover:underline ml-auto"
                        >
                          <span>⚠️ Failed to send — tap to retry</span>
                        </button>
                      )}

                      {/* Display Emoji Reactions */}
                      {m.reactions && m.reactions.length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1.5 ${m.isMe ? 'justify-end' : 'justify-start'}`}>
                          {Object.entries(
                            m.reactions.reduce((acc, r) => {
                              const emoji = r.emoji;
                              acc[emoji] = acc[emoji] || [];
                              acc[emoji].push(r.user);
                              return acc;
                            }, {})
                          ).map(([emoji, usersList]) => {
                            const hasReacted = usersList.some((u) => u._id === user._id || u === user._id);
                            return (
                              <button
                                key={emoji}
                                onClick={() => handleToggleReaction(m._id, emoji)}
                                title={usersList.map((u) => u.name || 'Someone').join(', ')}
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold border transition-all ${
                                  hasReacted
                                    ? 'bg-brand-500/10 border-brand-500/30 text-brand-500'
                                    : 'bg-slate-50 dark:bg-slate-850/80 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span>{usersList.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Action hovering trigger buttons */}
                    {hoveredMessageId === m._id && (
                      <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md rounded-full px-1.5 py-1 z-20 ${
                        m.isMe ? 'right-[100%] mr-2' : 'left-[100%] ml-2'
                      }`}>
                        {/* Reaction picker trigger */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowReactionPickerId(showReactionPickerId === m._id ? null : m._id)}
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-xs"
                            title="React"
                          >
                            😊
                          </button>
                          {showReactionPickerId === m._id && (
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-1.5 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
                              {EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleToggleReaction(m._id, emoji)}
                                  className="hover:scale-125 transition-transform text-xs"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Reply button */}
                        <button
                          type="button"
                          onClick={() => setReplyingTo(m)}
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                          title="Reply"
                        >
                          💬
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {partnerTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* File Attachment Selected Preview */}
              {selectedFile && (
                <div className="px-4 py-2.5 bg-brand-50/60 dark:bg-slate-900 border-t border-brand-200 dark:border-slate-800 flex items-center justify-between animate-in slide-in-from-bottom duration-150">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {filePreview ? (
                      selectedFile.type.startsWith('video/') ? (
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-white shrink-0">
                          <Film className="w-5 h-5" />
                        </div>
                      ) : (
                        <img src={filePreview} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-slate-300 dark:border-slate-700 shrink-0" />
                      )
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-brand-500/20 text-brand-500 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Reply Preview Above Input */}
              {replyingTo && (
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 animate-in slide-in-from-bottom duration-150">
                  <div className="flex-1 truncate">
                    <span className="font-extrabold text-brand-500">Replying to {replyingTo.sender?.name || (replyingTo.isMe ? 'You' : 'User')}: </span>
                    <span className="italic">"{replyingTo.text}"</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg ml-2 transition-colors text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Input */}
              {isRecording ? (
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-red-500/5 dark:bg-slate-900 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs font-bold text-red-500 font-mono">
                      {Math.floor(recordingTime / 60)}:{(recordingTime % 60) < 10 ? '0' : ''}{recordingTime % 60}
                    </span>
                  </div>

                  {/* Animated Waveform Indicator */}
                  <div className="flex-1 flex items-center justify-center gap-1 h-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <span
                        key={i}
                        className="w-1 bg-red-400 dark:bg-red-500 rounded-full animate-pulse"
                        style={{
                          height: `${Math.max(20, Math.sin(recordingTime + i) * 100)}%`,
                          animationDuration: `${0.4 + (i % 3) * 0.2}s`
                        }}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
                    title="Cancel recording"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={stopAndSendRecording}
                    className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors shrink-0 shadow-sm"
                    title="Send voice note"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSend}
                  className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,video/*,application/pdf,.doc,.docx"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                    title="Attach file or media"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={startRecording}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
                    title="Record voice message"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    placeholder={selectedFile ? "Add a caption..." : `Message ${partner.name}...`}
                    value={text}
                    onChange={handleTyping}
                    onBlur={stopTyping}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <Button type="submit" size="md" disabled={(!text.trim() && !selectedFile) || isUploading} isLoading={isUploading}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              )}
            </>
          )}

          {/* Empty state */}
          {!showNewChat && !partner && (
            <div className="flex-1 hidden sm:flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <MessageSquare className="w-7 h-7 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="font-bold text-slate-600 dark:text-slate-300 text-sm">Your Messages</h3>
              <p className="text-xs mt-1 max-w-xs">Select a conversation or start a new one with the <strong>+</strong> button</p>
              <button
                onClick={() => { setShowNewChat(true); setShowChat(true); }}
                className="mt-4 flex items-center gap-2 px-4 py-2 text-xs font-bold text-brand-500 bg-brand-500/10 rounded-xl hover:bg-brand-500/20 transition-colors"
              >
                <UserPlus className="w-4 h-4" /> New Conversation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
