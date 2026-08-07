import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { LiveClassCard } from '../../components/liveClasses/LiveClassCard.jsx';
import { ScheduleClassModal } from '../../components/liveClasses/ScheduleClassModal.jsx';
import {
  Video,
  Send,
  Users,
  Monitor,
  MessageSquare,
  Plus,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Wifi
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  useGetLiveClassesQuery,
  useRecordAttendanceMutation,
  useStartInstantLiveClassMutation
} from '../../redux/api/liveClassApi.js';
import toast from 'react-hot-toast';

const STATUS_TABS = ['ALL', 'LIVE', 'SCHEDULED', 'ENDED'];

export const LiveClasses = () => {
  const { user } = useSelector((state) => state.auth);
  const socket = useSocket();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const joinClassId = searchParams.get('join');

  const [activeTab, setActiveTab] = useState('ALL');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null); // the class being joined
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const chatEndRef = useRef(null);

  const { data, isLoading, refetch } = useGetLiveClassesQuery(
    activeTab === 'ALL' ? {} : { status: activeTab },
    { pollingInterval: 15000 } // refresh every 15s
  );
  const [recordAttendance] = useRecordAttendanceMutation();
  const [startInstantLiveClass, { isLoading: isStartingInstant }] = useStartInstantLiveClassMutation();

  const classes = data?.data || [];

  // Auto-join if class ID is in URL query parameters
  useEffect(() => {
    if (joinClassId && classes.length > 0) {
      const cls = classes.find((c) => c._id === joinClassId);
      if (cls && cls.status === 'LIVE') {
        handleJoinClass(cls);
        navigate('/live-classes', { replace: true });
      }
    }
  }, [joinClassId, classes, navigate]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket events for live session
  useEffect(() => {
    if (!socket || !activeSession) return;

    const classId = activeSession._id;
    socket.emit('join_live_class', { classId, user: { name: user?.name || 'Student', _id: user?._id } });

    socket.on('receive_class_chat', (data) => {
      setMessages((prev) => [
        ...prev,
        {
          sender: data.sender?.name || 'User',
          text: data.message,
          time: new Date(data.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          isMe: data.sender?._id === user?._id
        }
      ]);
    });

    socket.on('user_joined_class', (data) => {
      setMessages((prev) => [
        ...prev,
        { sender: 'System', text: `${data.user?.name || 'Someone'} joined the class`, time: 'Now', isSystem: true }
      ]);
      setOnlineCount((c) => c + 1);
    });

    socket.on('user_left_class', (data) => {
      setMessages((prev) => [
        ...prev,
        { sender: 'System', text: `${data.user?.name || 'Someone'} left the class`, time: 'Now', isSystem: true }
      ]);
      setOnlineCount((c) => Math.max(0, c - 1));
    });

    return () => {
      socket.emit('leave_live_class', { classId, user: { name: user?.name } });
      socket.off('receive_class_chat');
      socket.off('user_joined_class');
      socket.off('user_left_class');
    };
  }, [socket, activeSession, user]);

  const handleJoinClass = async (cls) => {
    setActiveSession(cls);
    setMessages([
      {
        sender: 'System',
        text: `You joined "${cls.title}". Welcome! 🎉`,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      }
    ]);
    // Record attendance
    try {
      await recordAttendance(cls._id).unwrap();
    } catch {
      // Attendance may already be recorded — ignore error
    }
  };

  const handleLeaveClass = () => {
    setActiveSession(null);
    setMessages([]);
  };

  const handleStartInstantClass = async () => {
    try {
      const res = await startInstantLiveClass().unwrap();
      toast.success('Instant live class created! Joining now... 🔴');
      handleJoinClass(res.data);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to start instant class');
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    if (socket && activeSession) {
      socket.emit('send_class_chat', {
        classId: activeSession._id,
        sender: { name: user?.name, _id: user?._id },
        message: chatMessage
      });
    }
    // Optimistic local echo
    setMessages((prev) => [
      ...prev,
      {
        sender: 'You',
        text: chatMessage,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        isMe: true
      }
    ]);
    setChatMessage('');
  };

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  // ── Active Session View ──────────────────────────────────────────────────────
  if (activeSession) {
    return (
      <div className="space-y-4">
        {/* Back bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleLeaveClass}
            className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Classes
          </button>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <Wifi className="w-3.5 h-3.5" />
              Connected
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Jitsi Meet Embed */}
          <Card className="lg:col-span-2 p-0 overflow-hidden bg-slate-950 border-slate-800 flex flex-col" style={{ minHeight: 480 }}>
            <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  LIVE — {activeSession.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  <Users className="w-3.5 h-3.5 inline mr-1" />
                  {(activeSession.attendeesCount || 0) + onlineCount} attending
                </span>
                {activeSession.meetingLink && (
                  <a
                    href={activeSession.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in Tab
                  </a>
                )}
              </div>
            </div>

            {/* Jitsi Meet iframe */}
            <div className="flex-1 relative">
              {activeSession.meetingLink ? (
                <iframe
                  src={`${activeSession.meetingLink}#userInfo.displayName="${encodeURIComponent(user?.name || 'Student')}"`}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="camera; microphone; fullscreen; display-capture; autoplay"
                  title={activeSession.title}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                  <Monitor className="w-16 h-16 text-brand-500 animate-pulse" />
                  <p className="text-sm font-semibold text-slate-200">Joining meeting room...</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>{activeSession.subject?.name}</span>
              <Button size="sm" variant="danger" onClick={handleLeaveClass}>
                Leave Room
              </Button>
            </div>
          </Card>

          {/* Real-time chat */}
          <Card className="flex flex-col" style={{ height: 480 }}>
            <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-500" /> Live Chat
              </h3>
              <span className="text-[10px] text-emerald-500 font-bold">Real-Time</span>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2 text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl ${
                    m.isSystem
                      ? 'bg-slate-100 dark:bg-slate-800/30 text-center text-slate-500'
                      : m.isMe
                      ? 'bg-brand-600/20 border border-brand-500/20'
                      : 'bg-slate-100 dark:bg-slate-800/60'
                  }`}
                >
                  {!m.isSystem && (
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`font-bold ${m.isMe ? 'text-brand-400' : 'text-indigo-400'}`}>
                        {m.sender}
                      </span>
                      <span className="text-[10px] text-slate-400">{m.time}</span>
                    </div>
                  )}
                  <p className="text-slate-800 dark:text-slate-200">{m.text}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Button type="submit" size="sm">
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  // ── Class List View ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Live Classes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTeacher ? 'Schedule and manage your live classes' : 'Join live sessions with your instructors'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => refetch()} className="gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          {isTeacher && (
            <>
              <Button
                size="sm"
                variant="primary"
                className="bg-red-600 hover:bg-red-500 gap-1 font-bold text-white shadow-md shadow-red-500/20"
                onClick={handleStartInstantClass}
                disabled={isStartingInstant}
              >
                <Wifi className="w-3.5 h-3.5 animate-pulse" />
                {isStartingInstant ? 'Starting...' : '⚡ Go Live Instantly'}
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="bg-indigo-600 hover:bg-indigo-500 gap-1"
                onClick={() => setShowScheduleModal(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                Schedule Class
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab === 'ALL' ? 'All Classes' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            {tab === 'LIVE' && classes.filter((c) => c.status === 'LIVE').length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[9px] rounded-full">
                {classes.filter((c) => c.status === 'LIVE').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Classes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} classes found</p>
          {isTeacher && (
            <Button size="sm" variant="primary" className="mt-4 bg-indigo-600" onClick={() => setShowScheduleModal(true)}>
              Schedule Your First Class
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <LiveClassCard
              key={cls._id}
              cls={cls}
              currentUser={user}
              onJoin={handleJoinClass}
            />
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleClassModal onClose={() => setShowScheduleModal(false)} />
      )}
    </div>
  );
};
