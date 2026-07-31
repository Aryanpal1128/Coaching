import React, { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext.jsx';
import { Bell, Check, Sparkles, MessageSquare, Video, Trophy } from 'lucide-react';

export const NotificationDropdown = ({ onClose }) => {
  const socket = useSocket();
  const [notifications, setNotifications] = useState([
    {
      _id: '1',
      title: 'AI Answer Evaluation Completed',
      message: 'Your answer for Graph Algorithms achieved 92% Accuracy!',
      type: 'AI_EVALUATION_COMPLETED',
      createdAt: new Date(),
      isRead: false
    },
    {
      _id: '2',
      title: 'Prof. Turing Scheduled Live Class',
      message: 'Advanced Graph Algorithms starts at 10:00 AM',
      type: 'TEACHER_LIVE_CLASS',
      createdAt: new Date(),
      isRead: false
    }
  ]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_notification', (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });

    return () => socket.off('new_notification');
  }, [socket]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'AI_EVALUATION_COMPLETED':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'TEACHER_LIVE_CLASS':
        return <Video className="w-4 h-4 text-emerald-400" />;
      case 'BADGE_EARNED':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-brand-400" />;
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-500" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Notifications
          </h3>
        </div>
        <button
          onClick={markAllRead}
          className="text-[11px] font-semibold text-brand-500 hover:underline"
        >
          Mark all read
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">No notifications yet</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                !n.isRead ? 'bg-brand-500/5' : ''
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {n.title}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                  {n.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
