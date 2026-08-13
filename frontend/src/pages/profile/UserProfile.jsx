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
import {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation
} from '../../redux/api/authApi.js';
import {
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetFollowersQuery,
  useGetFollowingQuery
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

export const UserProfile = () => {
  const { id: routeUserId } = useParams();
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

  const followersCount = profileRes?.data?.followersCount ?? profile?.followers?.length ?? 0;
  const followingCount = profileRes?.data?.followingCount ?? profile?.following?.length ?? 0;
  const isFollowingUser = profileRes?.data?.isFollowing ?? false;

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
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl animate-pulse">
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
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Failed to Load Profile</h3>
        <p className="text-xs text-slate-500 mt-1">{error?.data?.message || 'Profile could not be found.'}</p>
      </Card>
    );
  }

  const displayAvatar = avatarPreview || user?.avatar;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Hero Card */}
      <div className="overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md relative rounded-2xl flex flex-col p-0 pb-6">
        {/* Banner with dot-grid pattern */}
        <div className="h-32 sm:h-40 w-full bg-gradient-to-r from-brand-900/60 to-indigo-900/60 relative overflow-hidden bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:16px_16px]">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
        </div>

        {/* Center profile wrapper */}
        <div className="px-6 pb-2 text-center -mt-16 sm:-mt-20 relative z-10">
          {/* Avatar */}
          <div className="relative inline-block shrink-0">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={user?.name}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-2xl ring-4 ring-brand-500/10"
              />
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white text-4xl font-extrabold border-4 border-white dark:border-slate-900 shadow-2xl ring-4 ring-brand-500/10">
                {getInitials(user?.name)}
              </div>
            )}
            {isUploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center z-10 border-4 border-white dark:border-slate-900">
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
                  className="absolute bottom-1 right-1 p-2 rounded-full bg-brand-600 hover:bg-brand-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 z-20 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Name */}
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-3 tracking-wide uppercase">
            {user?.name || 'Your Profile'}
          </h2>

          {/* Badges */}
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-extrabold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <GraduationCap className="w-3.5 h-3.5" />
              {user?.role || 'STUDENT'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
              {user?.level || 'Beginner'}
            </span>
          </div>

          {/* Username */}
          {user?.username && (
            <p className="text-xs font-bold text-brand-500 mt-2.5 flex items-center justify-center gap-1">
              <span>@{user.username}</span>
              {isOwnProfile && (
                <button
                  onClick={handleOpenEditProfile}
                  className="text-xs text-slate-400 hover:text-slate-200 underline font-normal cursor-pointer ml-1"
                >
                  Edit
                </button>
              )}
            </p>
          )}

          {/* Stats Row Container */}
          <div className="border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-4 max-w-md mx-auto mt-5 flex justify-around items-center">
            {/* Reputation Points */}
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">{user?.reputation || 0}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Reputation Pts</p>
              </div>
            </div>
            {/* Divider */}
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
            {/* Followers */}
            <button onClick={() => setFollowModalType('followers')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <User className="w-5 h-5 text-purple-500 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">{followersCount}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Followers</p>
              </div>
            </button>
            {/* Divider */}
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
            {/* Following */}
            <button onClick={() => setFollowModalType('following')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Users className="w-5 h-5 text-brand-500 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">{followingCount}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Following</p>
              </div>
            </button>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex justify-center">
            {isOwnProfile ? (
              <Button onClick={handleOpenEditProfile} variant="outline" className="rounded-full border-slate-350 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-xs px-6 py-2 flex items-center gap-1.5 shadow-xs">
                <Edit className="w-3.5 h-3.5" /> Edit Profile
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate('/messages', { state: { startChatWith: user } })}
                  variant="outline"
                  className="rounded-full border-slate-350 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-xs px-6 py-2 flex items-center gap-1.5 shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Message
                </Button>
                
                {isFollowingUser ? (
                  <Button
                    onClick={() => unfollowUser(activeUserId)}
                    disabled={isUnfollowingLoading}
                    variant="outline"
                    className="rounded-full border-red-500/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-extrabold text-xs px-6 py-2 flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Following
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
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-xl w-full p-6 sm:p-8 space-y-5 my-8 max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Edit className="w-5 h-5 text-brand-500" /> Edit Profile
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
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
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white text-lg font-bold border-2 border-brand-500 shadow-md">
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
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-white dark:bg-slate-800 border border-brand-500 text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow cursor-pointer"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Profile Avatar</p>
                  <p className="text-[11px] text-slate-400">Click to upload a new profile picture.</p>
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
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-emerald-500">{editUsernameStatus.message}</span>
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bio
                </label>
                <textarea
                  placeholder="Tell us about yourself..."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
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
      <div ref={tabsRef} className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto justify-around sm:justify-start">
        {tabs.map((tab) => {
          let icon = <LayoutGrid className="w-4 h-4" />;
          if (tab === 'Questions Asked') icon = <HelpCircle className="w-4 h-4" />;
          if (tab === 'Saved Questions') icon = <Bookmark className="w-4 h-4" />;
          if (tab === 'My Enrollments' || tab === 'Paid Rooms') icon = <BookOpen className="w-4 h-4" />;

          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 py-3 px-1 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                active
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {icon}
              <span>{tab}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content: Overview */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bio & Details */}
          <Card className="flex flex-row justify-between items-start gap-4 p-6 sm:p-7 relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="space-y-4 flex-1 min-w-0">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <span>About</span>
              </h3>
              <p className="text-xs text-slate-605 dark:text-slate-300 leading-relaxed font-medium">
                {profile?.bio || 'Passionate learner with a strong interest in exploring new concepts and building a solid foundation in academics.'}
              </p>
              {(profile?.institution || user?.institution) && (
                <div className="pt-2 text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Institution</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{profile.institution || user.institution || 'General Academy'}</p>
                </div>
              )}
            </div>
            
            {/* Books Stack Illustration */}
            <svg className="w-20 h-20 sm:w-32 sm:h-32 shrink-0 text-brand-500 self-center" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Potted Plant */}
              <rect x="15" y="85" width="14" height="18" rx="3" fill="#3B82F6" opacity="0.8"/>
              <path d="M22 65 C20 75 16 85 16 85" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M22 65 C24 75 28 85 28 85" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="22" cy="62" r="6" fill="#10B981"/>
              <circle cx="16" cy="70" r="5" fill="#059669"/>
              <circle cx="28" cy="72" r="5" fill="#059669"/>
              
              {/* Stack of books */}
              {/* Book 1 (Bottom, Green) */}
              <path d="M45 80 H105 V92 H45 Z" fill="#059669" stroke="#047857" strokeWidth="1.5"/>
              <path d="M45 80 C40 80 40 92 45 92" fill="#10B981"/>
              <rect x="52" y="84" width="45" height="4" rx="1" fill="#047857" opacity="0.6"/>

              {/* Book 2 (Middle, Orange) */}
              <path d="M42 66 H102 V78 H42 Z" fill="#EA580C" stroke="#C2410C" strokeWidth="1.5"/>
              <path d="M42 66 C37 66 37 78 42 78" fill="#F97316"/>
              <rect x="49" y="70" width="45" height="4" rx="1" fill="#C2410C" opacity="0.6"/>

              {/* Book 3 (Top, Blue) */}
              <path d="M48 52 H108 V64 H48 Z" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1.5"/>
              <path d="M48 52 C43 52 43 64 48 64" fill="#3B82F6"/>
              <rect x="55" y="56" width="45" height="4" rx="1" fill="#1D4ED8" opacity="0.6"/>

              {/* Graduation Cap */}
              <path d="M78 28 L110 38 L78 48 L46 38 Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5"/>
              <rect x="68" y="44" width="20" height="10" fill="#0F172A" stroke="#334155" strokeWidth="1.5"/>
              <path d="M94 38 L98 52" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="98" cy="54" r="2.5" fill="#F59E0B"/>
            </svg>
          </Card>

          {/* Achievements */}
          <Card className="flex flex-row justify-between items-start gap-4 p-6 sm:p-7 relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="space-y-4 flex-1 min-w-0">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <span>Achievements</span>
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                {/* Rep Points sub-card */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                    <Flame className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">{user?.reputation || 0} Pts</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Reputation Points</p>
                  </div>
                </div>

                {/* Level sub-card */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">Level: {user?.level || 'Beginner'}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Keep learning and grow!</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Gold Trophy Illustration */}
            <svg className="w-20 h-20 sm:w-32 sm:h-32 shrink-0 self-center" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Gold Trophy */}
              <path d="M40 40 H80 V62 C80 72 72 80 60 80 C48 80 40 72 40 62 Z" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5"/>
              <path d="M60 80 V94" stroke="#CA8A04" strokeWidth="3" strokeLinecap="round"/>
              <path d="M45 94 H75" stroke="#CA8A04" strokeWidth="3" strokeLinecap="round"/>
              <rect x="42" y="94" width="36" height="8" rx="2" fill="#475569"/>
              
              {/* Handles */}
              <path d="M40 46 H32 V58 H40" stroke="#CA8A04" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M80 46 H88 V58 H80" stroke="#CA8A04" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              
              {/* Star on Trophy */}
              <path d="M60 50 L62 55 L67 55 L63 58 L65 63 L60 60 L55 63 L57 58 L53 55 L58 55 Z" fill="#FFF" opacity="0.9"/>
              
              {/* Confetti */}
              <circle cx="25" cy="30" r="2" fill="#3B82F6"/>
              <circle cx="95" cy="35" r="1.5" fill="#EF4444"/>
              <rect x="30" y="70" width="3" height="3" fill="#10B981" transform="rotate(45 30 70)"/>
              <rect x="88" y="75" width="2.5" height="2.5" fill="#EAB308" transform="rotate(30 88 75)"/>
              <path d="M28 50 Q31 52 34 50" stroke="#EC4899" strokeWidth="1" fill="none"/>
              <path d="M92 58 Q95 60 98 58" stroke="#3B82F6" strokeWidth="1" fill="none"/>
            </svg>
          </Card>
        </div>
      )}

      {/* Tab Content: Questions Asked */}
      {activeTab === 'Questions Asked' && (
        <div className="space-y-4">
          {askedQuestions.length === 0 ? (
            <Card className="p-8 text-center text-slate-400">
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
            <Card className="p-8 text-center text-slate-400">
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
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold gap-1.5"
              >
                <Lock className="w-4 h-4" /> + Create Paid Room
              </Button>
            </div>
          )}

          {((isOwnProfile && isTeacher ? myRooms : teacherRooms) || []).length === 0 ? (
            <Card className="p-10 text-center text-slate-400">
              <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3 opacity-40" />
              <p className="font-semibold text-slate-300">No Paid Rooms Offered Yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {isOwnProfile && isTeacher
                  ? 'Create a paid room to bundle live classes and study materials for paying students.'
                  : `${user?.name || 'This instructor'} has not created any paid rooms yet.`}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(isOwnProfile && isTeacher ? myRooms : teacherRooms).map((r) => {
                const priceInINR = (r.price / 100).toFixed(0);
                return (
                  <Card key={r._id} className="flex flex-col justify-between hover:border-amber-500/40 transition-all border-amber-500/10">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                          <Lock className="w-5 h-5" />
                        </div>
                        <span className="text-base font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                          ₹{priceInINR}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white leading-snug">{r.title}</h4>
                      {r.description && (
                        <p className="text-xs text-slate-400 mt-1.5 line-clamp-3">{r.description}</p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {r.isActive ? '🟢 Active Room' : '🔴 Inactive'}
                      </span>
                      {!isOwnProfile && (
                        <Button
                          size="sm"
                          onClick={() => handleEnrollInRoom(r)}
                          disabled={isOrdering}
                          className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-md shadow-amber-500/20"
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
            <Card className="p-10 text-center text-slate-400">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-40" />
              <p className="font-semibold text-slate-300">No Active Enrollments</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Explore instructors' paid rooms and enroll to get unlimited access to exclusive live classes and study materials.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myEnrollments.map((e) => {
                const r = e.room;
                const priceInINR = r?.price ? (r.price / 100).toFixed(0) : '0';
                return (
                  <Card key={e._id} className="flex flex-col justify-between border-emerald-500/20 bg-emerald-500/5">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <Badge variant="emerald" size="xs">ACTIVE</Badge>
                      </div>
                      <h4 className="text-base font-black text-white leading-snug">{r?.title || 'Paid Room'}</h4>
                      <p className="text-xs text-slate-400 mt-1">Instructor: {r?.teacher?.name || 'Teacher'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Paid: ₹{priceInINR}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Enrolled on {new Date(e.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <span className="text-emerald-400 font-bold">Lifetime Access</span>
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
    </div>
  );
};
