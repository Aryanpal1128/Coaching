import React, { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext.jsx';
import { Bell, Sparkles, MessageSquare, Video, Trophy, UserPlus } from 'lucide-react';
import { useGetNotificationsQuery, useMarkAsReadMutation } from '../../redux/api/notificationApi.js';
import { Link } from 'react-router-dom';

export const NotificationDropdown = ({ onClose }) => {
  const socket = useSocket();
  const { data: notifData, refetch } = useGetNotificationsQuery();
  const [markAsRead] = useMarkAsReadMutation();

  const [liveNotifications, setLiveNotifications] = useState([]);

  useEffect(() => {
    if (notifData?.data) {
      setLiveNotifications(notifData.data);
    }
  }, [notifData]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_notification', (newNotif) => {
      setLiveNotifications((prev) => [newNotif, ...prev]);
      refetch();
    });

    return () => socket.off('new_notification');
  }, [socket, refetch]);

  const handleNotificationClick = (item) => {
    if (!item.isRead && item._id) {
      markAsRead(item._id);
    }
  };

  const markAllRead = () => {
    liveNotifications.forEach((n) => {
      if (!n.isRead && n._id) {
        markAsRead(n._id);
      }
    });
    setLiveNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'AI_EVALUATION_COMPLETED':
        return <Sparkles className="w-4 h-4 text-[#C5A059]" />;
      case 'TEACHER_LIVE_CLASS':
        return <Video className="w-4 h-4 text-green-400" />;
      case 'BADGE_EARNED':
        return <Trophy className="w-4 h-4 text-accent-500" />;
      case 'NEW_FOLLOWER':
        return <UserPlus className="w-4 h-4 text-brand-400" />;
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
        {liveNotifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">No notifications yet</div>
        ) : (
          liveNotifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleNotificationClick(n)}
              className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
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

                {n.link && (
                  <Link
                    to={n.link}
                    onClick={onClose}
                    className="inline-block text-[10px] font-bold text-brand-500 hover:underline mt-1"
                  >
                    View profile →
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

