import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { apiSlice } from '../../redux/api/apiSlice.js';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Send, ArrowLeft, Search, UserPlus, X, MessageSquare } from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useGetUsersQuery,
  useToggleReactionMutation
} from '../../redux/api/messageApi.js';

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
  
  // Message Reply & Reaction States
  const [replyingTo, setReplyingTo] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [showReactionPickerId, setShowReactionPickerId] = useState(null);

  const typingTimer = useRef(null);
  const messagesEndRef = useRef(null);

  const [toggleReactionApi] = useToggleReactionMutation();

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

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveMessages, partnerTyping]);

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
          setLiveMessages((prev) => [
            ...prev,
            {
              _id: msg._id,
              text: msg.text,
              isMe: false,
              sender: msg.sender,
              parentMessage: msg.parentMessage,
              reactions: msg.reactions || [],
              createdAt: msg.createdAt
            }
          ]);
        }
        return currentPartner;
      });
      // Refresh conversations sidebar
      refetchConvs();
      // Invalidate RTK cache for this convo
      dispatch(apiSlice.util.invalidateTags(['Message']));
    });

    socket.on('message_reaction_updated', ({ messageId, reactions }) => {
      setLiveMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    });

    socket.on('message_sent', (msg) => {
      // Server ack — conversation update
      refetchConvs();
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
  }, [socket, user?._id, dispatch, refetchConvs]);

  const handleSelectPartner = (usr) => {
    setPartner(usr);
    setShowChat(true);
    setShowNewChat(false);
    setLiveMessages([]);
    setReplyingTo(null);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !partner || !socket) return;

    const tempId = `temp-${Date.now()}`;
    
    // Optimistic UI
    setLiveMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        text: text.trim(),
        isMe: true,
        sender: user,
        parentMessage: replyingTo ? { _id: replyingTo._id, text: replyingTo.text, sender: replyingTo.sender } : null,
        reactions: [],
        createdAt: new Date().toISOString()
      }
    ]);

    socket.emit('send_direct_message', {
      senderId: user._id,
      recipientId: partner._id,
      text: text.trim(),
      parentMessageId: replyingTo ? replyingTo._id : null
    });

    setText('');
    setReplyingTo(null);
    stopTyping();
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
                <div className="relative">
                  <Avatar user={partner} />
                  {isOnline(partner._id) && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{partner.name}</h3>
                  <p className={`text-[10px] font-semibold ${isOnline(partner._id) ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {partnerTyping ? '✍️ typing...' : isOnline(partner._id) ? 'Online' : 'Offline'}
                    {partner.role && ` • ${partner.role}`}
                  </p>
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
                    className={`flex relative group ${m.isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="relative max-w-[70%] sm:max-w-sm">
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

                      <div className={`shadow-sm px-3.5 py-2.5 ${
                        m.isMe
                          ? 'bg-brand-600 text-white rounded-br-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm border border-slate-200 dark:border-slate-700'
                      } ${m.parentMessage ? 'rounded-b-2xl' : 'rounded-2xl'}`}>
                        <p className="text-xs leading-relaxed break-words">{m.text}</p>
                        <p className={`text-[8px] mt-1 text-right ${m.isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {fmtTime(m.createdAt)}
                        </p>
                      </div>

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
              <form
                onSubmit={handleSend}
                className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900"
              >
                <input
                  type="text"
                  placeholder={`Message ${partner.name}...`}
                  value={text}
                  onChange={handleTyping}
                  onBlur={stopTyping}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Button type="submit" size="md" disabled={!text.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
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
