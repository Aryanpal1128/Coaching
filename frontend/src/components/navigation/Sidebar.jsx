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
    <aside
      className="hidden md:flex md:static inset-y-0 left-0 z-40 w-64 bg-white/90 dark:bg-[#0B1321]/90 backdrop-blur-md border-r border-theme-border flex-col shrink-0"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-theme-border flex items-center justify-between">
        <Link to={getDashboardPath()} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1B365D] to-[#C5A059] flex items-center justify-center text-[#060B16] shadow-lg shadow-[#1B365D]/20 font-black text-xl shrink-0">
            AI
          </div>
          <div>
            <h1 className="font-extrabold text-theme-primary text-base leading-tight">
              Coaching<span className="text-[#C5A059]">.ai</span>
            </h1>
            <p className="text-[10px] text-theme-secondary font-medium">Smart Student Platform</p>
          </div>
        </Link>
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
                  `flex items-center gap-3 px-3.5 py-3 min-h-[44px] rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-blue/10 text-brand-blue font-[800]'
                      : item.highlight
                      ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/30 hover:bg-brand-gold/20'
                      : 'text-theme-secondary hover:bg-theme-global hover:text-theme-primary'
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
          <div className="p-4 border-t border-theme-border">
            <Link to="/profile" onClick={onClose} className="block">
              <div className="bg-theme-global border border-theme-border rounded-xl p-3 flex items-center gap-3 hover:bg-theme-border transition-colors">
                <img
                  src={user.avatar || 'https://res.cloudinary.com/demo/image/upload/v1571218039/sample.jpg'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-brand-gold/50 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-[800] text-theme-primary truncate">{user.name}</p>
                  <p className="text-[10px] text-brand-gold font-medium">⚡ {user.reputation || 0} pts</p>
                </div>
                <span className="text-[10px] bg-theme-border text-theme-primary px-2 py-0.5 rounded-full font-[800] shrink-0">
                  {user.level || 'Beginner'}
                </span>
              </div>
            </Link>
          </div>
        )}
      </aside>
  );
};
