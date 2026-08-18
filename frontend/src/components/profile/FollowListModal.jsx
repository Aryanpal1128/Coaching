import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { X, UserPlus, UserMinus, UserCheck, Loader2 } from 'lucide-react';
import {
  useGetFollowersQuery,
  useGetFollowingQuery,
  useFollowUserMutation,
  useUnfollowUserMutation
} from '../../redux/api/followApi.js';

export const FollowListModal = ({ userId, type, onClose }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);

  // Fetch followers or following depending on the type prop
  const isFollowers = type === 'followers';
  const { data: listRes, isLoading, error } = isFollowers 
    ? useGetFollowersQuery(userId, { skip: !userId })
    : useGetFollowingQuery(userId, { skip: !userId });

  // Get current user's following list to see who they are following
  const { data: myFollowingRes } = useGetFollowingQuery(currentUser?._id, {
    skip: !currentUser?._id
  });

  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useUnfollowUserMutation();

  const usersList = (listRes?.data?.users || []).filter(Boolean);
  const myFollowingIds = (myFollowingRes?.data?.users || []).filter(Boolean).map((u) => u._id);

  const handleUserClick = (targetUserId) => {
    navigate(`/profile/${targetUserId}`);
    onClose();
  };

  const renderFollowButton = (user) => {
    if (!currentUser || user._id === currentUser._id) return null;

    const isFollowing = myFollowingIds.includes(user._id);

    if (isFollowing) {
      return (
        <button
          onClick={() => unfollowUser(user._id)}
          className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold border border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
        >
          <UserMinus className="w-3 h-3" />
          <span>Unfollow</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => followUser(user._id)}
        className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold bg-brand-600 hover:bg-brand-500 text-white shadow-xs transition-colors cursor-pointer"
      >
        <UserPlus className="w-3 h-3" />
        <span>Follow</span>
      </button>
    );
  };

  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-880 shrink-0">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 capitalize">
            {type}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 flex-col gap-2">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
              <p className="text-[10px] text-slate-400 font-semibold">Loading users...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-xs text-rose-500 font-bold">
              Failed to load users.
            </div>
          ) : usersList.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 font-semibold">
              {isFollowers ? 'No followers yet.' : 'Not following anyone yet.'}
            </div>
          ) : (
            usersList.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                {/* User Info (Tapping goes to profile) */}
                <div
                  onClick={() => handleUserClick(user._id)}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-2"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1B365D] to-[#C5A059] flex items-center justify-center text-[#060B16] text-xs font-black shrink-0">
                      {(user.name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate hover:underline">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      @{user.username || 'username'}
                    </p>
                  </div>
                </div>

                {/* Follow/Unfollow Button */}
                <div className="shrink-0">
                  {renderFollowButton(user)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
