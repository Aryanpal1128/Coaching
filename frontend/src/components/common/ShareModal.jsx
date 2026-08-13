import React, { useState } from 'react';
import { Search, Send, X, Check } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useGetConversationsQuery, useSendMessageMutation, useGetUsersQuery } from '../../redux/api/messageApi.js';
import { useGetFollowingQuery } from '../../redux/api/followApi.js';
import toast from 'react-hot-toast';

export const ShareModal = ({ isOpen, onClose, shareUrl, shareTitle }) => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  const { data: conversationsData } = useGetConversationsQuery(undefined, {
    skip: !isOpen
  });
  const { data: followingData } = useGetFollowingQuery(currentUser?._id, {
    skip: !isOpen || !currentUser?._id
  });
  const { data: searchData } = useGetUsersQuery(search, {
    skip: !isOpen || !search.trim()
  });

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

  if (!isOpen) return null;

  // Build unique list of users from conversations and following
  const conversationsUsers = conversationsData?.data?.map((c) => c.user) || [];
  const followingUsers = followingData?.data?.users || [];

  // Merge and deduplicate
  const userMap = new Map();
  conversationsUsers.forEach((u) => {
    if (u && u._id !== currentUser?._id) userMap.set(u._id, u);
  });
  followingUsers.forEach((u) => {
    if (u && u._id !== currentUser?._id) userMap.set(u._id, u);
  });

  let displayUsers = Array.from(userMap.values());

  // If searching, show search results instead
  if (search.trim()) {
    displayUsers = searchData?.data || [];
  }

  const handleToggleUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSend = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Select at least one user to share with');
      return;
    }

    try {
      const shareText = `Shared a question: *${shareTitle}*\nLink: ${shareUrl}`;
      const promises = selectedUsers.map((recipientId) =>
        sendMessage({ recipientId, text: shareText }).unwrap()
      );
      await Promise.all(promises);
      toast.success('Shared successfully!');
      setSelectedUsers([]);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to share');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Send to</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
          {displayUsers.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No contacts or users found.
            </div>
          ) : (
            displayUsers.map((user) => {
              const isSelected = selectedUsers.includes(user._id);
              return (
                <div
                  key={user._id}
                  onClick={() => handleToggleUser(user._id)}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar || 'https://res.cloudinary.com/demo/image/upload/v1571218039/sample.jpg'}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-250 dark:border-slate-800"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-950 dark:text-slate-100">{user.name}</p>
                      <p className="text-[10px] text-slate-400">@{user.username || 'user'}</p>
                    </div>
                  </div>

                  {/* Select indicator */}
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0 flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold text-slate-400">
            {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleSend}
            disabled={selectedUsers.length === 0 || isSending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-500/10 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};
