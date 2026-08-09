import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  HelpCircle,
  Trophy,
  Video,
  BookOpen,
  MessageSquare,
  Shield,
  Sparkles,
  Bookmark,
  X
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useSelector((state) => state.auth);

  const getDashboardPath = () => {
    if (user?.role === 'TEACHER') return '/teacher-dashboard';
    if (user?.role === 'ADMIN') return '/admin-dashboard';
    return '/dashboard';
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: getDashboardPath() },
    { label: 'Q&A Feed', icon: HelpCircle, path: '/questions' },
    { label: 'Saved Questions', icon: Bookmark, path: '/saved' },
    { label: 'Ask AI Question', icon: Sparkles, path: '/ask-question', highlight: true },
    { label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
    { label: 'Live Classes', icon: Video, path: '/live-classes' },
    { label: 'Study Materials', icon: BookOpen, path: '/study-materials' },
    { label: 'Messages', icon: MessageSquare, path: '/messages' }
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ label: 'Admin Panel', icon: Shield, path: '/admin-dashboard' });
  }

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <Link to={getDashboardPath()} className="flex items-center gap-3" onClick={onClose}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 font-black text-xl shrink-0">
              AI
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 dark:text-slate-100 text-base leading-tight">
                Coaching<span className="text-brand-500">.ai</span>
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Smart Student Platform</p>
            </div>
          </Link>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                      : item.highlight
                      ? 'bg-gradient-to-r from-amber-500/10 to-brand-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Reputation Widget */}
        {user && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <Link to="/profile" onClick={onClose} className="block">
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <img
                  src={user.avatar || 'https://res.cloudinary.com/demo/image/upload/v1571218039/sample.jpg'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-brand-500/50 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">{user.name}</p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">⚡ {user.reputation || 0} pts</p>
                </div>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-full font-bold shrink-0">
                  {user.level || 'Beginner'}
                </span>
              </div>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
};
