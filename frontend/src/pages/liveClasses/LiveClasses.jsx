import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Video, Send, Users, Monitor, PlayCircle, MessageSquare } from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';

export const LiveClasses = () => {
  const socket = useSocket();
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'Prof. Turing', text: 'Welcome everyone! Today we discuss BFS shortest path tree proofs.', time: '10:00 AM' }
  ]);
  const [isSharingScreen, setIsSharingScreen] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.emit('join_live_class', { classId: 'live101', user: { name: 'Student' } });

    socket.on('receive_class_chat', (data) => {
      setMessages((prev) => [...prev, { sender: data.sender?.name || 'User', text: data.message, time: 'Now' }]);
    });

    return () => {
      socket.emit('leave_live_class', { classId: 'live101' });
    };
  }, [socket]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    if (socket) {
      socket.emit('send_class_chat', {
        classId: 'live101',
        sender: { name: 'Student' },
        message: chatMessage
      });
    } else {
      setMessages((prev) => [...prev, { sender: 'You', text: chatMessage, time: 'Now' }]);
    }
    setChatMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Active Session Screen Share & Chat Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Screen Share / Live Stream Box */}
        <Card className="lg:col-span-2 p-0 overflow-hidden bg-slate-950 border-slate-800 flex flex-col min-h-[350px] justify-between">
          <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                LIVE SESSION IN PROGRESS
              </span>
            </div>
            <Badge variant="indigo">Advanced Graph Masterclass</Badge>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <Monitor className="w-16 h-16 text-brand-500 mb-3 animate-pulse" />
            <h3 className="text-base font-bold text-slate-200">
              Prof. Alan Turing is sharing screen
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              "Topological Sorting & Kahn's Algorithm Implementation"
            </p>
          </div>

          <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-brand-500" /> 48 Students Attending
            </span>
            <Button size="sm" variant="danger">Leave Room</Button>
          </div>
        </Card>

        {/* Real-time Live Class Chat */}
        <Card className="flex flex-col h-[400px]">
          <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-500" /> Live Class Chat
            </h3>
            <span className="text-[10px] text-emerald-500 font-bold">Real-Time</span>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5 text-xs">
            {messages.map((m, idx) => (
              <div key={idx} className="bg-slate-100 dark:bg-slate-800/60 p-2.5 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand-500">{m.sender}</span>
                  <span className="text-[10px] text-slate-400">{m.time}</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 mt-1">{m.text}</p>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="Type message..."
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
};
