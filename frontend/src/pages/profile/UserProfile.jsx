import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { StatCard } from '../../components/common/StatCard.jsx';
import { QuestionCard } from '../../components/questions/QuestionCard.jsx';
import { CreateRoomModal } from '../../components/rooms/CreateRoomModal.jsx';
import { FollowListModal } from '../../components/profile/FollowListModal.jsx';
import {
  Trophy,
  Flame,
  Award,
  BookOpen,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  UserCheck,
  UserPlus,
  UserMinus,
  Mail,
  Camera,
  Loader2,
  Edit,
  X,
  CheckCircle2,
  XCircle,
  Users,
  User,
  Search,
  Lock,
  DollarSign,
  ShieldCheck,
  Sparkles,
  LayoutGrid,
  Bookmark,
  TrendingUp,
  GraduationCap
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Trophy as PhTrophy,
  Medal as PhMedal,
  ListChecks as PhListChecks,
  Chat as PhChat,
  Flame as PhFlame
} from '@phosphor-icons/react';
import {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation
} from '../../redux/api/authApi.js';
import {
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useGetFollowCountsQuery
} from '../../redux/api/followApi.js';
import { useSearchQuestionsQuery } from '../../redux/api/questionApi.js';
import { useGetSubjectsQuery } from '../../redux/api/teacherApi.js';
import {
  useGetMyRoomsQuery,
  useGetTeacherRoomsQuery,
  useCreateRoomOrderMutation,
  useVerifyRoomPaymentMutation,
  useGetMyEnrollmentsQuery
} from '../../redux/api/roomApi.js';
import { updateUser } from '../../redux/slices/authSlice.js';
import { handleRazorpayPayment } from '../../utils/razorpay.js';
import toast from 'react-hot-toast';

const getLevelProgress = (reputation, levelStr) => {
  const rep = reputation || 0;
  const level = levelStr || 'Beginner';

  if (level.includes('Beginner') || rep <= 100) {
    return { min: 0, max: 100, pct: Math.min(100, Math.max(0, (rep / 100) * 100)) };
  } else if (level.includes('Learner') || (rep > 100 && rep <= 300)) {
    return { min: 101, max: 300, pct: Math.min(100, Math.max(0, ((rep - 101) / 199) * 100)) };
  } else if (level.includes('Contributor') || (rep > 300 && rep <= 700)) {
    return { min: 301, max: 700, pct: Math.min(100, Math.max(0, ((rep - 301) / 399) * 100)) };
  } else if (level.includes('Expert') || (rep > 700 && rep <= 1500)) {
    return { min: 701, max: 1500, pct: Math.min(100, Math.max(0, ((rep - 701) / 799) * 100)) };
  } else {
    return { min: 1501, max: 3000, pct: 100 }; // Master
  }
};

const CountUp = ({ value, duration = 800 }) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      setCount(value);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );
    const el = elementRef.current;
    if (el) {
      observer.observe(el);
    }
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasStarted, value]);

  useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const end = parseInt(value, 10) || 0;
    if (end === 0) {
      setCount(0);
      return;
    }
    const totalMiliseconds = duration;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 16);
    const step = Math.max(Math.ceil(end / (totalMiliseconds / incrementTime)), 1);
    let timer = setInterval(() => {
      start += step;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, incrementTime);
    return () => clearInterval(timer);
  }, [hasStarted, value, duration]);

  return <span ref={elementRef}>{count}</span>;
};

export const UserProfile = () => {
  const { userId: routeUserId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);

  // If routeUserId is provided, fetch that user's profile, else fetch current user's profile
  const activeUserId = routeUserId || currentUser?._id;
  const isOwnProfile = !routeUserId || routeUserId === currentUser?._id;

  const { data: profileRes, isLoading, error, refetch } = useGetUserProfileQuery(activeUserId, {
    skip: !activeUserId
  });
  const user = profileRes?.data?.user || (isOwnProfile ? currentUser : null);
  const profile = profileRes?.data?.profile || {};

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  // Room RTK Query hooks
  const { data: myRoomsRes, refetch: refetchMyRooms } = useGetMyRoomsQuery(undefined, {
    skip: !isOwnProfile || !isTeacher
  });
  const myRooms = myRoomsRes?.data || [];

  const { data: teacherRoomsRes, refetch: refetchTeacherRooms } = useGetTeacherRoomsQuery(activeUserId, {
    skip: !activeUserId
  });
  const teacherRooms = teacherRoomsRes?.data || [];

  const { data: myEnrollmentsRes, refetch: refetchMyEnrollments } = useGetMyEnrollmentsQuery(undefined, {
    skip: !isOwnProfile || isTeacher
  });
  const myEnrollments = myEnrollmentsRes?.data || [];

  const [createOrder, { isLoading: isOrdering }] = useCreateRoomOrderMutation();
  const [verifyPayment] = useVerifyRoomPaymentMutation();

  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);

  const [followUser, { isLoading: isFollowingLoading }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: isUnfollowingLoading }] = useUnfollowUserMutation();
  const [updateProfile, { isLoading: isSavingProfile }] = useUpdateUserProfileMutation();

  const { data: subjectsRes } = useGetSubjectsQuery();
  const subjectsList = subjectsRes?.data || [];

  // Followers & Following modal state
  const [followModalType, setFollowModalType] = useState(null); // 'followers' | 'following' | null
  const [followSearchQuery, setFollowSearchQuery] = useState('');

  const { data: followersRes, isLoading: followersLoading } = useGetFollowersQuery(activeUserId, {
    skip: !activeUserId || followModalType !== 'followers'
  });
  const { data: followingRes, isLoading: followingLoading } = useGetFollowingQuery(activeUserId, {
    skip: !activeUserId || followModalType !== 'following'
  });

  const [isHoveringFollowBtn, setIsHoveringFollowBtn] = useState(false);

  const { data: followCountsRes } = useGetFollowCountsQuery(activeUserId, {
    skip: !activeUserId
  });

  const followersCount = followCountsRes?.data?.followers ?? followCountsRes?.data?.followersCount ?? profileRes?.data?.followersCount ?? profile?.followers?.length ?? 0;
  const followingCount = followCountsRes?.data?.following ?? followCountsRes?.data?.followingCount ?? profileRes?.data?.followingCount ?? profile?.following?.length ?? 0;
  const isFollowingUser = followCountsRes?.data?.isFollowing ?? false;

  // Edit Profile Modal State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editUsernameStatus, setEditUsernameStatus] = useState(null);
  const [editBio, setEditBio] = useState('');
  const [editStream, setEditStream] = useState('');
  const [editInstitution, setEditInstitution] = useState('');
  const [editGradeOrYear, setEditGradeOrYear] = useState('');
  const [editSelectedSubjects, setEditSelectedSubjects] = useState([]);
  const [editAvatarPreview, setEditAvatarPreview] = useState(null);
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const editModalFileInputRef = useRef(null);

  // Avatar upload state for hero card button
  const fileInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Debounced live username availability check
  useEffect(() => {
    if (!isEditingProfile) return;

    const trimmed = editUsername.trim();
    if (!trimmed) {
      setEditUsernameStatus({ isChecking: false, isValid: false, message: 'Username cannot be empty.' });
      return;
    }

    if (trimmed === user?.username) {
      setEditUsernameStatus({ isChecking: false, isValid: true, message: 'Current username.' });
      return;
    }

    if (trimmed.length < 3) {
      setEditUsernameStatus({ isChecking: false, isValid: false, message: 'Must be at least 3 characters.' });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setEditUsernameStatus({ isChecking: false, isValid: false, message: 'Letters, numbers, underscores only.' });
      return;
    }

    setEditUsernameStatus({ isChecking: true, isValid: false, message: 'Checking availability...' });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/auth/check-username?username=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (data.status === 'success' && data.data?.isAvailable) {
          setEditUsernameStatus({ isChecking: false, isValid: true, message: 'Username available!' });
        } else {
          setEditUsernameStatus({ isChecking: false, isValid: false, message: 'Username is already taken.' });
        }
      } catch {
        setEditUsernameStatus({ isChecking: false, isValid: true, message: 'Username ready.' });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [editUsername, isEditingProfile, user?.username]);

  const handleOpenEditProfile = () => {
    setEditUsername(user?.username || '');
    setEditUsernameStatus({ isChecking: false, isValid: true, message: 'Current username.' });
    setEditBio(profile?.bio || '');
    setEditStream(profile?.stream || '');
    setEditInstitution(profile?.institution || '');
    setEditGradeOrYear(profile?.gradeOrYear || '');

    const initialSubjectIds = (profile?.subjectsOfInterest || profile?.subjectsTaught || []).map(
      (s) => (typeof s === 'string' ? s : s._id)
    );
    setEditSelectedSubjects(initialSubjectIds);
    setEditAvatarPreview(user?.avatar || null);
    setEditAvatarFile(null);
    setIsEditingProfile(true);
  };

  const handleModalAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editUsernameStatus?.isValid) return toast.error('Please enter a valid, available username.');

    try {
      const formData = new FormData();
      formData.append('username', editUsername.trim());
      formData.append('bio', editBio.trim());

      if (!isTeacher) {
        if (editStream) formData.append('stream', editStream);
        if (editInstitution) formData.append('institution', editInstitution.trim());
        if (editGradeOrYear) formData.append('gradeOrYear', editGradeOrYear.trim());
        if (editSelectedSubjects.length > 0) {
          formData.append('subjectsOfInterest', JSON.stringify(editSelectedSubjects));
        }
      } else {
        if (editSelectedSubjects.length > 0) {
          formData.append('subjectsTaught', JSON.stringify(editSelectedSubjects));
        }
      }

      if (editAvatarFile) {
        formData.append('avatar', editAvatarFile);
      }

      const res = await updateProfile(formData).unwrap();
      if (res.data?.user && isOwnProfile) {
        dispatch(updateUser(res.data.user));
      }
      toast.success('Profile updated successfully! 🎉');
      setIsEditingProfile(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update profile.');
    }
  };

  const handleAvatarClick = () => {
    if (!isOwnProfile) return;
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await updateProfile(formData).unwrap();
      if (res.data?.user) {
        dispatch(updateUser(res.data.user));
      }
      toast.success('Avatar updated successfully!');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to upload avatar.');
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleEnrollInRoom = async (targetRoom) => {
    try {
      const orderResponse = await createOrder(targetRoom._id).unwrap();
      await handleRazorpayPayment({
        orderResponse: orderResponse.data,
        user: currentUser,
        verifyPaymentMutation: verifyPayment,
        onSuccess: () => {
          if (refetchTeacherRooms) refetchTeacherRooms();
          if (refetchMyEnrollments) refetchMyEnrollments();
        }
      });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to start enrollment');
    }
  };

  const tabs = isTeacher
    ? ['Overview', 'Questions Asked', 'Paid Rooms']
    : isOwnProfile
      ? ['Overview', 'Questions Asked', 'Saved Questions', 'My Enrollments']
      : ['Overview', 'Questions Asked', 'Paid Rooms'];

  const [activeTab, setActiveTab] = useState('Overview');
  const tabsRef = useRef(null);

  const { data: askedQuestionsRes } = useSearchQuestionsQuery(
    { askedBy: activeUserId },
    { skip: !activeUserId }
  );
  const askedQuestions = askedQuestionsRes?.data?.questions || [];

  const { data: savedQuestionsRes } = useSearchQuestionsQuery(
    { bookmarkedBy: activeUserId },
    { skip: !activeUserId || !isOwnProfile }
  );
  const savedQuestions = savedQuestionsRes?.data?.questions || [];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex h-[300px] items-center justify-center bg-transparent flex-col gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B365D] to-[#C5A059] flex items-center justify-center text-[#060B16] font-black text-xl animate-pulse">
          AI
        </div>
        <p className="text-xs text-slate-400 animate-pulse">Loading profile...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto my-12">
        <Trophy className="w-12 h-12 text-rose-500 mx-auto mb-3 opacity-30" />
        <h3 className="text-sm font-bold text-theme-primary">Failed to Load Profile</h3>
        <p className="text-xs text-theme-secondary mt-1">{error?.data?.message || 'Profile could not be found.'}</p>
      </Card>
    );
  }
  const displayAvatar = avatarPreview || user?.avatar;

  return (
    <div className="relative min-h-screen space-y-6 max-w-4xl mx-auto pb-12 p-3 sm:p-0">
      {/* Page-wide Gradient Background Layer */}
      <div className="absolute inset-0 -z-10 bg-theme-global"></div>

      {/* Profile Hero Card */}
      <div className="border border-theme-border bg-theme-card shadow-theme relative rounded-[32px] flex flex-col p-6 sm:p-8 mt-6">

        {/* Center profile wrapper */}
        <div className="text-center relative z-10 flex flex-col items-center">
          {/* Avatar */}
          <div className="relative inline-block shrink-0 mb-6 sm:mb-7">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={user?.name}
                className="w-32 h-32 sm:w-[140px] sm:h-[140px] rounded-full object-cover border-4 border-white shadow-sm ring-1 ring-brand-blue/20"
              />
            ) : (
              <div className="w-32 h-32 sm:w-[140px] sm:h-[140px] rounded-full bg-theme-secondary-bg flex items-center justify-center text-theme-primary text-4xl font-extrabold border-4 border-white shadow-sm ring-1 ring-brand-blue/20">
                {getInitials(user?.name)}
              </div>
            )}
            {isUploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-10 border-4 border-white">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            {isOwnProfile && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  title="Upload profile picture"
                  className="absolute bottom-2 right-1 p-2.5 sm:p-3 rounded-full bg-brand-blue hover:bg-brand-dark-blue text-white shadow-md transition-transform hover:scale-105 active:scale-95 z-20 cursor-pointer border-2 border-white"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Name */}
          <h2 className="text-2xl sm:text-[28px] font-[900] text-theme-primary tracking-wide uppercase leading-tight mb-4">
            {user?.name || 'Your Profile'}
          </h2>


          {/* Username & Edit */}
          <div className="flex items-center justify-center gap-3 mb-4">
            {user?.username && (
              <span className="text-[13px] sm:text-sm font-semibold text-brand-blue">
                @{user.username}
              </span>
            )}
            {isOwnProfile && (
              <button
                onClick={handleOpenEditProfile}
                className="text-[13px] sm:text-sm text-theme-secondary hover:text-brand-blue transition-colors font-medium cursor-pointer ml-1 underline decoration-transparent hover:decoration-brand-blue underline-offset-2"
              >
                Edit
              </button>
            )}
          </div>

          {/* Badges */}
          <div className="flex items-center justify-center gap-3 mb-3.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-[800] bg-brand-light-blue border border-brand-blue/20 text-brand-blue">
              <GraduationCap className="w-4 h-4" />
              <span className="uppercase">{user?.role || 'STUDENT'}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-[800] bg-brand-light-gold border border-brand-gold/30 text-brand-gold">
              <TrendingUp className="w-4 h-4" />
              <span className="uppercase">{user?.level || 'BEGINNER'}</span>
            </span>
          </div>



          {/* Stats Row Container */}
          <div className="w-full border border-theme-border bg-theme-card rounded-[24px] p-5 sm:p-6 mt-8 grid grid-cols-3 items-center relative overflow-hidden shadow-sm">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/50 dark:from-white/5 via-transparent to-transparent opacity-20 pointer-events-none" />

            {/* Reputation Points */}
            <div className="flex flex-col items-center justify-center gap-1.5 relative z-10">
              <div className="text-brand-gold bg-brand-light-gold/50 border border-brand-gold/10 p-2 rounded-full mb-1">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[20px] sm:text-2xl font-[900] text-theme-primary leading-none">{user?.reputation || 0}</span>
              <span className="text-[9px] sm:text-[10px] text-theme-muted font-[700] tracking-wider uppercase">Reputation Pts</span>
              {/* Divider */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-12 bg-theme-border" />
            </div>

            {/* Followers */}
            <button
              onClick={() => setFollowModalType('followers')}
              className="flex flex-col items-center justify-center gap-1.5 relative group cursor-pointer z-10"
            >
              <div className="text-brand-blue bg-brand-light-blue/50 border border-brand-blue/10 p-2 rounded-full mb-1 group-hover:scale-110 transition-transform">
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[20px] sm:text-2xl font-[900] text-theme-primary leading-none group-hover:text-brand-blue transition-colors">{followersCount}</span>
              <span className="text-[9px] sm:text-[10px] text-theme-muted font-[700] tracking-wider uppercase">Followers</span>
              {/* Divider */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-12 bg-theme-border" />
            </button>

            {/* Following */}
            <button
              onClick={() => setFollowModalType('following')}
              className="flex flex-col items-center justify-center gap-1.5 group cursor-pointer z-10"
            >
              <div className="text-brand-blue bg-brand-light-blue/50 border border-brand-blue/10 p-2 rounded-full mb-1 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[20px] sm:text-2xl font-[900] text-theme-primary leading-none group-hover:text-brand-blue transition-colors">{followingCount}</span>
              <span className="text-[9px] sm:text-[10px] text-theme-muted font-[700] tracking-wider uppercase">Following</span>
            </button>
          </div>

          {/* Action buttons */}
          {!isOwnProfile && (
            <div className="mt-5 flex justify-center">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate('/messages', { state: { startChatWith: user } })}
                  variant="outline"
                  className="rounded-full border-theme-border hover:bg-theme-card text-theme-primary font-extrabold text-xs px-6 py-2 flex items-center gap-1.5 shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Message
                </Button>

                {isFollowingUser ? (
                  <Button
                    onClick={() => unfollowUser(activeUserId)}
                    disabled={isUnfollowingLoading}
                    onMouseEnter={() => setIsHoveringFollowBtn(true)}
                    onMouseLeave={() => setIsHoveringFollowBtn(false)}
                    variant="outline"
                    className="rounded-full border-red-500/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-extrabold text-xs px-6 py-2 flex items-center gap-1.5 transition-all duration-200"
                  >
                    {isHoveringFollowBtn ? (
                      <>
                        <UserMinus className="w-3.5 h-3.5" /> Unfollow
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" /> Following
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => followUser(activeUserId)}
                    disabled={isFollowingLoading}
                    className="rounded-full bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs px-6 py-2 flex items-center gap-1.5 shadow-md shadow-brand-500/20"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Follow
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-xl w-full p-6 sm:p-8 space-y-5 my-8 max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-extrabold text-theme-primary flex items-center gap-2">
                <Edit className="w-5 h-5 text-brand-500" /> Edit Profile
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="p-1 rounded-lg text-theme-secondary hover:text-theme-primary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-left">
              {/* Avatar upload */}
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {editAvatarPreview ? (
                    <img
                      src={editAvatarPreview}
                      alt="Avatar Preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-brand-500 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1B365D] to-[#C5A059] flex items-center justify-center text-[#060B16] text-lg font-bold border-2 border-brand-500 shadow-md">
                      {getInitials(user?.name)}
                    </div>
                  )}
                  <input
                    type="file"
                    ref={editModalFileInputRef}
                    accept="image/*"
                    onChange={handleModalAvatarFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => editModalFileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-theme-global border border-brand-500 text-brand-500 hover:bg-theme-card transition-colors shadow cursor-pointer"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <p className="text-xs font-bold text-theme-primary">Profile Avatar</p>
                  <p className="text-[11px] text-theme-secondary">Click to upload a new profile picture.</p>
                </div>
              </div>

              {/* Username */}
              <div>
                <Input
                  label="Username"
                  placeholder="e.g. alex_learner"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="font-bold text-xs"
                />
                {editUsernameStatus && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold">
                    {editUsernameStatus.isChecking ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 text-brand-500 animate-spin shrink-0" />
                        <span className="text-slate-400">{editUsernameStatus.message}</span>
                      </>
                    ) : editUsernameStatus.isValid ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        <span className="text-green-500">{editUsernameStatus.message}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="text-rose-500">{editUsernameStatus.message}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold text-theme-primary mb-1">
                  Bio
                </label>
                <textarea
                  placeholder="Tell us about yourself..."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full bg-theme-global border border-theme-border rounded-xl p-3 text-xs text-theme-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-theme-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProfile(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSavingProfile}
                  disabled={!editUsernameStatus?.isValid || isSavingProfile}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Tabs Header */}
      <div ref={tabsRef} className="flex items-center justify-between border-b border-theme-border overflow-x-auto pb-0 mt-4 px-2 sm:px-4">
        <div className="flex items-center gap-6 sm:gap-10 min-w-max w-full justify-start">
          {tabs.map((tab) => {
            let icon = <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />;
            if (tab === 'Questions Asked') icon = <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
            if (tab === 'Saved Questions') icon = <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />;
            if (tab === 'My Enrollments' || tab === 'Paid Rooms') icon = <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />;

            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 py-4 px-1 text-[12px] sm:text-[14px] transition-all cursor-pointer relative ${active
                  ? 'text-brand-blue font-[800]'
                  : 'text-theme-secondary hover:text-theme-primary font-[600]'
                  }`}
              >
                {icon}
                <span>{tab}</span>
                {active && (
                  <motion.div
                    layoutId="activeTabProfile"
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand-blue rounded-t-full"
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="hidden sm:flex text-theme-secondary p-2 shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
      </div>      {/* Tab Content: Overview */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Bio & Details */}
          <div className="p-6 sm:p-7 relative overflow-hidden bg-theme-card rounded-[24px] border border-brand-blue/20 shadow-sm">
            <div className="space-y-4 flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-[800] text-theme-primary flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-light-blue text-brand-blue flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <span>About</span>
              </h3>
              <p className="text-sm text-theme-secondary font-[500] pl-11">
                {profile?.bio || 'don tell me what to do'}
              </p>

              {/* Institution, Stream & Subjects Chips */}
              {(profile?.institution || user?.institution || profile?.stream || (profile?.subjectsOfInterest && profile.subjectsOfInterest.length > 0) || (profile?.subjectsTaught && profile.subjectsTaught.length > 0)) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ staggerChildren: 0.1 }}
                  className="flex flex-wrap gap-2 pt-5 mt-2 border-t border-theme-border pl-11"
                >
                  {(profile?.institution || user?.institution || true) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-[800] bg-brand-light-blue text-brand-blue border border-brand-blue/20"
                    >
                      <GraduationCap className="w-4 h-4 text-brand-blue" />
                      <span>{profile?.institution || user?.institution || 'General Academy'}</span>
                    </motion.div>
                  )}
                  {profile?.stream && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-[800] bg-brand-light-blue text-brand-blue border border-brand-blue/20"
                    >
                      <BookOpen className="w-4 h-4 text-brand-blue" />
                      <span>{profile.stream}</span>
                    </motion.div>
                  )}
                  {((profile?.subjectsOfInterest || profile?.subjectsTaught || [])).map((subject, idx) => {
                    const subjectName = typeof subject === 'string' ? subject : subject.name;
                    if (!subjectName) return null;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-[800] bg-brand-light-blue text-brand-blue border border-brand-blue/20"
                      >
                        <span>📝</span>
                        <span>{subjectName}</span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>

          {/* Achievements */}
          <div className="p-5 sm:p-7 relative overflow-hidden bg-theme-card rounded-[24px] border border-brand-gold/20 shadow-sm flex flex-col gap-5 sm:gap-6">
            <h3 className="text-sm sm:text-base font-[800] text-theme-primary flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-light-gold text-brand-gold flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <span>Achievements</span>
            </h3>

            <div className="flex flex-row justify-between items-center gap-4">
              <div className="flex flex-col gap-3 sm:gap-4 flex-1 min-w-0">
                {/* Rep Points sub-card */}
                <div className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 bg-theme-global rounded-xl border border-theme-border transition-all hover:shadow-sm">
                  <div className="p-1.5 sm:p-2 bg-brand-light-gold text-brand-gold rounded-lg shrink-0">
                    <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold text-theme-primary truncate">{user?.reputation || 0} Pts</p>
                    <p className="text-[9px] sm:text-[10px] text-theme-secondary font-semibold mt-0.5 truncate">Reputation Points</p>
                  </div>
                </div>

                {/* Level sub-card */}
                <div className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 bg-theme-global rounded-xl border border-theme-border transition-all hover:shadow-sm">
                  <div className="p-1.5 sm:p-2 bg-brand-light-blue text-brand-blue rounded-lg shrink-0">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold text-theme-primary truncate">Level: {user?.level || 'Beginner'}</p>
                    <p className="text-[9px] sm:text-[10px] text-theme-secondary font-semibold mt-0.5 truncate">Keep learning and grow!</p>
                  </div>
                </div>
              </div>

              <div className="w-24 h-24 xl:w-32 xl:h-32 shrink-0 relative transition-all">
                <div className="absolute inset-0 bg-[#2B4C7E]/20 blur-3xl rounded-full" />
                <img
                  src="/assets/profile_trophy.jpg"
                  alt="Trophy"
                  className="w-full h-full object-cover rounded-[1.5rem] [mask-image:radial-gradient(circle_at_center,black_60%,transparent_100%)] relative z-10 opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Questions Asked */}
      {activeTab === 'Questions Asked' && (
        <div className="space-y-4">
          {askedQuestions.length === 0 ? (
            <Card className="p-8 text-center text-theme-secondary">
              <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold">No questions asked yet.</p>
            </Card>
          ) : (
            askedQuestions.map((q) => <QuestionCard key={q._id} question={q} />)
          )}
        </div>
      )}

      {/* Tab Content: Saved Questions */}
      {activeTab === 'Saved Questions' && (
        <div className="space-y-4">
          {savedQuestions.length === 0 ? (
            <Card className="p-8 text-center text-theme-secondary">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold">No saved questions.</p>
            </Card>
          ) : (
            savedQuestions.map((q) => <QuestionCard key={q._id} question={q} />)
          )}
        </div>
      )}

      {/* Tab Content: Paid Rooms (Teacher or Public View) */}
      {activeTab === 'Paid Rooms' && (
        <div className="space-y-4">
          {isOwnProfile && isTeacher && (
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => setShowCreateRoomModal(true)}
                className="bg-accent-605 hover:bg-accent-500 text-white font-bold gap-1.5"
              >
                <Lock className="w-4 h-4" /> + Create Paid Room
              </Button>
            </div>
          )}

          {((isOwnProfile && isTeacher ? myRooms : teacherRooms) || []).length === 0 ? (
            <Card className="p-10 text-center text-theme-secondary">
              <Lock className="w-12 h-12 text-accent-500 mx-auto mb-3 opacity-40" />
              <p className="font-semibold text-theme-primary">No Paid Rooms Offered Yet</p>
              <p className="text-xs text-theme-secondary mt-1 max-w-sm mx-auto">
                {isOwnProfile && isTeacher
                  ? 'Create a paid room to bundle live classes and study materials for paying students.'
                  : `${user?.name || 'This instructor'} has not created any paid rooms yet.`}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(isOwnProfile && isTeacher ? myRooms : teacherRooms).map((r) => {
                const priceInINR = r?.price ? (r.price / 100).toFixed(0) : '0';
                return (
                  <Card key={r._id} className="flex flex-col justify-between hover:border-accent-500/40 transition-all border-accent-500/10">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-accent-500/10 text-accent-500">
                          <Lock className="w-5 h-5" />
                        </div>
                        <span className="text-base font-black text-accent-500 bg-accent-500/10 px-3 py-1 rounded-full border border-accent-500/20">
                          ₹{priceInINR}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white leading-snug">{r.title}</h4>
                      {r.description && (
                        <p className="text-xs text-theme-secondary mt-1.5 line-clamp-3">{r.description}</p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-theme-border flex items-center justify-between">
                      <span className="text-[11px] text-theme-secondary">
                        {r.isActive ? '🟢 Active Room' : '🔴 Inactive'}
                      </span>
                      {!isOwnProfile && (
                        <Button
                          size="sm"
                          onClick={() => handleEnrollInRoom(r)}
                          disabled={isOrdering}
                          className="bg-accent-605 hover:bg-accent-500 text-white font-extrabold text-xs shadow-md shadow-accent-500/20"
                        >
                          Enroll Now — ₹{priceInINR}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: My Enrollments (Student) */}
      {activeTab === 'My Enrollments' && (
        <div className="space-y-4">
          {myEnrollments.length === 0 ? (
            <Card className="p-10 text-center text-theme-secondary">
              <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-40" />
              <p className="font-semibold text-theme-primary">No Active Enrollments</p>
              <p className="text-xs text-theme-secondary mt-1 max-w-sm mx-auto">
                Explore instructors' paid rooms and enroll to get unlimited access to exclusive live classes and study materials.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myEnrollments.map((e) => {
                const r = e.room;
                const priceInINR = r?.price ? (r.price / 100).toFixed(0) : '0';
                return (
                  <Card key={e._id} className="flex flex-col justify-between border-green-500/20 bg-green-500/5">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-green-500/10 text-green-400">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <Badge variant="emerald" size="xs">ACTIVE</Badge>
                      </div>
                      <h4 className="text-base font-black text-white leading-snug">{r?.title || 'Paid Room'}</h4>
                      <p className="text-xs text-theme-secondary mt-1">Instructor: {r?.teacher?.name || 'Teacher'}</p>
                      <p className="text-xs text-theme-secondary mt-0.5">Paid: ₹{priceInINR}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-theme-border flex items-center justify-between text-[11px] text-theme-secondary">
                      <span>Enrolled on {new Date(e.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <span className="text-green-400 font-bold">Lifetime Access</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Teacher Create Room Modal */}
      {showCreateRoomModal && (
        <CreateRoomModal onClose={() => setShowCreateRoomModal(false)} />
      )}

      {/* Followers & Following Modal */}
      {followModalType && (
        <FollowListModal
          userId={activeUserId}
          type={followModalType}
          onClose={() => setFollowModalType(null)}
        />
      )}
    </div>
  );
};
