import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Send, ArrowLeft, Search, Phone, MoreVertical } from 'lucide-react';

const CONTACTS = [
  {
    id: '1',
    name: 'Prof. Alan Turing',
    role: 'Instructor',
    avatar: '',
    lastMessage: 'Do you have any questions regarding Assignment 3?',
    time: '10:32 AM',
    unread: 2,
    online: true
  },
  {
    id: '2',
    name: 'Dr. Grace Hopper',
    role: 'Instructor',
    avatar: '',
    lastMessage: 'Great work on the last assignment!',
    time: 'Yesterday',
    unread: 0,
    online: false
  },
  {
    id: '3',
    name: 'Ada Lovelace',
    role: 'Student',
    avatar: '',
    lastMessage: 'Can we form a study group?',
    time: 'Mon',
    unread: 1,
    online: true
  },
  {
    id: '4',
    name: 'Charles Babbage',
    role: 'Student',
    avatar: '',
    lastMessage: 'Thanks for explaining BFS!',
    time: 'Sun',
    unread: 0,
    online: false
  }
];

const CHAT_HISTORY = {
  '1': [
    { id: 1, sender: 'Prof. Alan Turing', text: 'Hello! Do you have any questions regarding Assignment 3?', isMe: false, time: '10:30 AM' },
    { id: 2, sender: 'You', text: 'Hi Professor! Yes, I was confused about the edge case for disjoint graph components in Dijkstra.', isMe: true, time: '10:31 AM' },
    { id: 3, sender: 'Prof. Alan Turing', text: 'Great question! For disconnected components, you should initialize all unvisited nodes with ∞ and only the source with 0. Nodes unreachable from source will remain at ∞.', isMe: false, time: '10:32 AM' }
  ],
  '2': [
    { id: 1, sender: 'Dr. Grace Hopper', text: 'Great work on the last assignment!', isMe: false, time: 'Yesterday' }
  ],
  '3': [
    { id: 1, sender: 'Ada Lovelace', text: 'Hey! Can we form a study group for the exam?', isMe: false, time: 'Mon' },
    { id: 2, sender: 'You', text: 'Sure, sounds great! What topics should we cover?', isMe: true, time: 'Mon' }
  ],
  '4': [
    { id: 1, sender: 'Charles Babbage', text: 'Thanks for explaining BFS so clearly!', isMe: false, time: 'Sun' }
  ]
};

const getInitials = (name) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const COLORS = ['from-brand-600 to-indigo-600', 'from-emerald-600 to-teal-600', 'from-amber-500 to-orange-600', 'from-purple-600 to-pink-600'];

export const Messages = () => {
  const { user } = useSelector((state) => state.auth);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState({});
  const [text, setText] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [showChat, setShowChat] = useState(false); // mobile: toggle between list/chat
  const messagesEndRef = useRef(null);

  // Initialize messages from history
  useEffect(() => {
    setMessages(CHAT_HISTORY);
  }, []);

  // Auto scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedContact]);

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setShowChat(true);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedContact) return;

    const newMsg = {
      id: Date.now(),
      sender: user?.name || 'You',
      text: text.trim(),
      isMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), newMsg]
    }));
    setText('');
  };

  const filteredContacts = CONTACTS.filter((c) =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const currentMessages = selectedContact ? messages[selectedContact.id] || [] : [];

  return (
    <div className="h-[calc(100vh-140px)] min-h-[500px]">
      <div className="flex h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">

        {/* Contacts Sidebar */}
        <div className={`w-full sm:w-72 md:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 ${showChat ? 'hidden sm:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-3">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredContacts.map((contact, idx) => (
              <button
                key={contact.id}
                onClick={() => handleSelectContact(contact)}
                className={`w-full text-left p-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                  selectedContact?.id === contact.id ? 'bg-brand-500/5 border-r-2 border-brand-500' : ''
                }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${COLORS[idx % COLORS.length]} text-white flex items-center justify-center text-xs font-extrabold`}>
                    {getInitials(contact.name)}
                  </div>
                  {contact.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{contact.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-1">{contact.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{contact.lastMessage}</p>
                </div>
                {contact.unread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] font-extrabold flex items-center justify-center shrink-0">
                    {contact.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Panel */}
        <div className={`flex-1 flex flex-col min-w-0 ${!showChat && !selectedContact ? 'hidden sm:flex' : 'flex'}`}>
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900">
                {/* Back button on mobile */}
                <button
                  onClick={() => setShowChat(false)}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="relative shrink-0">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${COLORS[CONTACTS.findIndex(c => c.id === selectedContact.id) % COLORS.length]} text-white flex items-center justify-center text-xs font-extrabold`}>
                    {getInitials(selectedContact.name)}
                  </div>
                  {selectedContact.online && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{selectedContact.name}</h3>
                  <p className={`text-[10px] font-semibold ${selectedContact.online ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {selectedContact.online ? 'Online' : 'Offline'} • {selectedContact.role}
                  </p>
                </div>

                <button className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/50">
                {currentMessages.map((m) => (
                  <div key={m.id} className={`flex ${m.isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] sm:max-w-sm rounded-2xl px-3.5 py-2.5 shadow-sm ${
                      m.isMe
                        ? 'bg-brand-600 text-white rounded-br-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm border border-slate-200 dark:border-slate-700'
                    }`}>
                      {!m.isMe && (
                        <p className="text-[10px] font-bold text-brand-500 mb-0.5">{m.sender}</p>
                      )}
                      <p className="text-xs leading-relaxed">{m.text}</p>
                      <p className={`text-[9px] mt-1 text-right ${m.isMe ? 'text-blue-200' : 'text-slate-400'}`}>{m.time}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900"
              >
                <input
                  type="text"
                  placeholder={`Message ${selectedContact.name}...`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Button type="submit" size="md" disabled={!text.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 hidden sm:flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Send className="w-7 h-7 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="font-bold text-slate-600 dark:text-slate-300 text-sm">Select a conversation</h3>
              <p className="text-xs mt-1 max-w-xs">Choose a contact from the left panel to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
