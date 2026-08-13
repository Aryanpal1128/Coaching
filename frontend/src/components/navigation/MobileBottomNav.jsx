import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  House,
  ChatCircleDots,
  Sparkle,
  VideoCamera,
  DotsThreeCircle,
  BookmarkSimple,
  Trophy,
  BookOpen,
  User,
  Shield,
  SignOut,
  X,
  Sun,
  Moon
} from '@phosphor-icons/react';
import { logout } from '../../redux/slices/authSlice.js';
import { useTheme } from '../../context/ThemeContext.jsx';

export const MobileBottomNav = () => {
  const { user } = useSelector((state) => state.auth);
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const getDashboardPath = () => {
    if (user?.role === 'TEACHER') return '/teacher-dashboard';
    if (user?.role === 'ADMIN') return '/admin-dashboard';
    return '/dashboard';
  };

  const handleLogout = () => {
    setIsMoreOpen(false);
    dispatch(logout());
    navigate('/login');
  };

  const dashboardPath = getDashboardPath();

  const mainTabs = [
    {
      label: 'Home',
      icon: House,
      path: dashboardPath,
      isExact: true
    },
    {
      label: 'Feed',
      icon: ChatCircleDots,
      path: '/questions'
    },
    {
      label: 'Ask AI',
      icon: Sparkle,
      path: '/ask-question',
      isAccent: true
    },
    {
      label: 'Classes',
      icon: VideoCamera,
      path: '/live-classes'
    }
  ];

  const secondaryNavItems = [
    { label: 'Saved Questions', icon: BookmarkSimple, path: '/saved' },
    { label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
    { label: 'Study Materials', icon: BookOpen, path: '/study-materials' },
    { label: 'Messages', icon: ChatCircleDots, path: '/messages' },
    { label: 'Profile & Stats', icon: User, path: '/profile' }
  ];

  if (user?.role === 'ADMIN') {
    secondaryNavItems.push({ label: 'Admin Panel', icon: Shield, path: '/admin-dashboard' });
  }

  return (
    <>
      {/* "More" Bottom Sheet Drawer */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-250 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            {/* Top Handle bar */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto" />

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-xs">
                  AI
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    Navigation Menu
                  </h3>
                  <p className="text-[10px] text-slate-400">Coaching.ai Quick Shortcuts</p>
                </div>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1 py-1">
              {/* Theme Toggle item inside More drawer */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  {isDark ? (
                    <Sun size={18} weight="duotone" className="text-amber-400" />
                  ) : (
                    <Moon size={18} weight="duotone" className="text-slate-500" />
                  )}
                  <span>Appearance</span>
                </div>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400 font-semibold">
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </span>
              </button>

              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMoreOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon size={18} weight="duotone" className={active ? 'text-white' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all mt-1 cursor-pointer"
              >
                <SignOut size={18} weight="duotone" className="text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)] md:hidden shadow-lg">
        <div className="grid grid-cols-5 items-center h-16 px-1 max-w-md mx-auto">
          {/* Tab 1: Home */}
          <NavLink to={mainTabs[0].path}>
            {({ isActive }) => (
              <div
                className={`flex flex-col items-center justify-center py-1 transition-all ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 font-extrabold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <House size={22} weight={isActive ? 'fill' : 'duotone'} className="mb-0.5" />
                <span className="text-[10px] tracking-tight">Home</span>
              </div>
            )}
          </NavLink>

          {/* Tab 2: Feed */}
          <NavLink to={mainTabs[1].path}>
            {({ isActive }) => (
              <div
                className={`flex flex-col items-center justify-center py-1 transition-all ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 font-extrabold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <ChatCircleDots size={22} weight={isActive ? 'fill' : 'duotone'} className="mb-0.5" />
                <span className="text-[10px] tracking-tight">Feed</span>
              </div>
            )}
          </NavLink>

          {/* Tab 3: Raised Center Accent Button (Ask AI) */}
          <NavLink to={mainTabs[2].path}>
            {({ isActive }) => (
              <div className="flex flex-col items-center justify-center -mt-6 z-10">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-600 text-white shadow-xl shadow-brand-500/30 flex items-center justify-center border-4 border-white dark:border-slate-900 active:scale-95 transition-all">
                  <Sparkle size={24} weight={isActive ? 'fill' : 'duotone'} className="animate-pulse" />
                </div>
                <span className="text-[10px] font-extrabold text-brand-600 dark:text-brand-400 mt-0.5 tracking-tight">
                  Ask AI
                </span>
              </div>
            )}
          </NavLink>

          {/* Tab 4: Classes */}
          <NavLink to={mainTabs[3].path}>
            {({ isActive }) => (
              <div
                className={`flex flex-col items-center justify-center py-1 transition-all ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 font-extrabold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <VideoCamera size={22} weight={isActive ? 'fill' : 'duotone'} className="mb-0.5" />
                <span className="text-[10px] tracking-tight">Classes</span>
              </div>
            )}
          </NavLink>

          {/* Tab 5: More */}
          <button
            onClick={() => setIsMoreOpen(true)}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              isMoreOpen
                ? 'text-brand-600 dark:text-brand-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <DotsThreeCircle size={22} weight={isMoreOpen ? 'fill' : 'duotone'} className="mb-0.5" />
            <span className="text-[10px] tracking-tight">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};
