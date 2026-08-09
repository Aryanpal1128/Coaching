import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Sun, Moon, Bell, Search, User, LogOut, Menu, Shield, X, HelpCircle, BookOpen, Users, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { logout } from '../../redux/slices/authSlice.js';
import { NotificationDropdown } from './NotificationDropdown.jsx';
import { useSearchQuestionsQuery } from '../../redux/api/questionApi.js';
import { useGetUsersQuery } from '../../redux/api/messageApi.js';
import { useGetSubjectsQuery } from '../../redux/api/teacherApi.js';
import { Badge } from '../common/Badge.jsx';

export const Navbar = ({ toggleSidebar }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const desktopInputRef = useRef(null);
  const mobileInputRef = useRef(null);

  // Live queries for search dropdown
  const trimmedQuery = searchQuery.trim();
  const { data: questionsData, isLoading: isQSearchLoading } = useSearchQuestionsQuery(
    { query: trimmedQuery, limit: 5 },
    { skip: !trimmedQuery || !isSearchFocused }
  );

  const { data: usersData, isLoading: isUserSearchLoading } = useGetUsersQuery(trimmedQuery, {
    skip: !trimmedQuery || !isSearchFocused
  });

  const { data: subjectsData, isLoading: isSubjSearchLoading } = useGetSubjectsQuery(undefined, {
    skip: !trimmedQuery || !isSearchFocused
  });

  const matchedQuestions = Array.isArray(questionsData?.data)
    ? questionsData.data
    : Array.isArray(questionsData?.questions)
    ? questionsData.questions
    : [];

  const matchedUsers = usersData?.data || [];

  const allSubjects = subjectsData?.data || [];
  const matchedSubjects = allSubjects.filter(
    (s) =>
      s.name?.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
      s.code?.toLowerCase().includes(trimmedQuery.toLowerCase())
  );

  const isSearchLoading = isQSearchLoading || isUserSearchLoading || isSubjSearchLoading;

  // Clear input when navigating away from search page or route changes
  useEffect(() => {
    if (!location.pathname.startsWith('/search')) {
      setSearchQuery('');
    }
  }, [location.pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowMobileSearch(false);
      setIsSearchFocused(false);
    }
  };

  const handleClearSearch = (isMobile = false) => {
    setSearchQuery('');
    if (isMobile && mobileInputRef.current) {
      mobileInputRef.current.focus();
    } else if (desktopInputRef.current) {
      desktopInputRef.current.focus();
    }
  };

  const handleSelectResult = () => {
    setIsSearchFocused(false);
    setShowMobileSearch(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Menu Toggle + Search */}
        <div className="flex items-center gap-2 flex-1 min-w-0" ref={searchRef}>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden shrink-0 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop search bar */}
          <div className="relative max-w-md w-full hidden sm:block">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                ref={desktopInputRef}
                type="text"
                placeholder="Search questions, subjects, teachers..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                className={`w-full bg-slate-100 dark:bg-slate-800/60 border rounded-xl pl-10 pr-9 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none transition-all ${
                  isSearchFocused
                    ? 'border-brand-500 ring-2 ring-brand-500 shadow-md bg-white dark:bg-slate-900'
                    : 'border-slate-200 dark:border-slate-700/60'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleClearSearch(false)}
                  className="absolute right-3 top-2.5 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>

          {/* Mobile: animated search bar */}
          {showMobileSearch && (
            <div className="flex-1 flex items-center gap-2 sm:hidden relative">
              <form onSubmit={handleSearchSubmit} className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  ref={mobileInputRef}
                  autoFocus
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  className={`w-full bg-slate-100 dark:bg-slate-800 border rounded-xl pl-9 pr-9 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none transition-all ${
                    isSearchFocused
                      ? 'border-brand-500 ring-2 ring-brand-500 shadow-md bg-white dark:bg-slate-900'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleClearSearch(true)}
                    className="absolute right-3 top-2.5 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
              <button
                onClick={() => {
                  setShowMobileSearch(false);
                  setIsSearchFocused(false);
                }}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Live Search Results Dropdown */}
          {trimmedQuery && isSearchFocused && (
            <div className="absolute left-4 right-4 sm:left-auto sm:right-auto sm:w-[480px] top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
              {isSearchLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                </div>
              ) : (
                <>
                  {/* People Section */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <Users className="w-3.5 h-3.5 text-purple-500" /> People ({matchedUsers.length})
                    </h4>
                    {matchedUsers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No people found</p>
                    ) : (
                      <div className="space-y-1">
                        {matchedUsers.slice(0, 4).map((u) => (
                          <Link
                            key={u._id}
                            to={`/profile/${u._id}`}
                            onClick={handleSelectResult}
                            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <img
                              src={
                                u.avatar ||
                                'https://res.cloudinary.com/demo/image/upload/v1571218039/sample.jpg'
                              }
                              alt={u.name}
                              className="w-7 h-7 rounded-full border border-purple-500 object-cover shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                {u.name}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                            </div>
                            <Badge
                              variant={
                                u.role === 'TEACHER'
                                  ? 'amber'
                                  : u.role === 'ADMIN'
                                  ? 'red'
                                  : 'blue'
                              }
                              size="xs"
                            >
                              {u.role}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Questions Section */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <HelpCircle className="w-3.5 h-3.5 text-brand-500" /> Questions ({matchedQuestions.length})
                    </h4>
                    {matchedQuestions.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No questions found</p>
                    ) : (
                      <div className="space-y-1">
                        {matchedQuestions.slice(0, 4).map((q) => (
                          <Link
                            key={q._id}
                            to={`/questions/${q._id}`}
                            onClick={handleSelectResult}
                            className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                              {q.title}
                            </span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Subjects Section */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-500" /> Subjects ({matchedSubjects.length})
                    </h4>
                    {matchedSubjects.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No subjects found</p>
                    ) : (
                      <div className="space-y-1">
                        {matchedSubjects.slice(0, 3).map((s) => (
                          <Link
                            key={s._id}
                            to={`/questions?subject=${s._id}`}
                            onClick={handleSelectResult}
                            className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                              {s.name} {s.code && `(${s.code})`}
                            </span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                    <button
                      onClick={handleSearchSubmit}
                      className="text-xs font-bold text-brand-500 hover:underline"
                    >
                      View all results for "{trimmedQuery}" →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile search toggle */}
          {!showMobileSearch && (
            <button
              onClick={() => setShowMobileSearch(true)}
              className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications((p) => !p);
                setShowProfileMenu(false);
              }}
              className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-500 rounded-full animate-ping" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-500 rounded-full" />
            </button>

            {showNotifications && (
              <NotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfileMenu((p) => !p);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Profile menu"
            >
              <img
                src={user?.avatar || 'https://res.cloudinary.com/demo/image/upload/v1571218039/sample.jpg'}
                alt={user?.name || 'User'}
                className="w-8 h-8 rounded-full border-2 border-brand-500 object-cover"
              />
              <span className="text-sm font-semibold hidden md:inline-block text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                {user?.name || 'User'}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {user?.name}
                  </p>
                  <p className="text-[11px] text-slate-500 capitalize mt-0.5">
                    {user?.email}
                  </p>
                  <span className="inline-block mt-1 text-[10px] bg-brand-500/10 text-brand-500 border border-brand-500/20 px-2 py-0.5 rounded-full font-bold">
                    {user?.role}
                  </span>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <User className="w-4 h-4" /> Profile & Stats
                </Link>

                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin-dashboard"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-amber-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Shield className="w-4 h-4" /> Admin Panel
                  </Link>
                )}

                <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
