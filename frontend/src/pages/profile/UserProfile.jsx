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
  Search,
  Lock,
  DollarSign,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import {
  useGetUserProfileQuery,
  useUpdateProfileMutation
} from '../../redux/api/userApi.js';
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
import { updateCredentials } from '../../redux/slices/authSlice.js';
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
  const [updateProfile, { isLoading: isSavingProfile }] = useUpdateProfileMutation();

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
        dispatch(updateCredentials({ user: res.data.user }));
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
        dispatch(updateCredentials({ user: res.data.user }));
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
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={user?.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-brand-500 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold border-4 border-brand-500 shadow-xl">
                {getInitials(user?.name)}
              </div>
            )}
            {isUploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center z-10 border-4 border-brand-500">
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
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-white dark:bg-slate-800 border-2 border-brand-500 shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 z-20 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-brand-500" />
                </button>
              </>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {user?.name || 'Your Profile'}
              </h2>
              <Badge variant="blue">{user?.role || 'STUDENT'}</Badge>
              <Badge variant="emerald">{user?.level || 'Beginner'}</Badge>
            </div>

            {user?.username && (
              <p className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center justify-center sm:justify-start gap-1">
                <span>@{user.username}</span>
                {isOwnProfile && (
                  <button
                    onClick={handleOpenEditProfile}
                    className="text-[10px] text-slate-400 hover:text-brand-500 underline ml-1 font-normal cursor-pointer"
                  >
                    Edit
                  </button>
                )}
              </p>
            )}

            {isOwnProfile && user?.email && (
              <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </p>
            )}

            {profile?.title && (
              <p className="text-xs text-slate-500 font-semibold mt-1">{profile.title}</p>
            )}

            {profile?.bio && (
              <p className="text-xs text-slate-400 mt-2 max-w-xl italic">
                "{profile.bio}"
              </p>
            )}

            {/* Followers & Following counts row */}
            <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-amber-500">
                <Trophy className="w-4 h-4" /> {user?.reputation || 0} Reputation Pts
              </span>
              <button
                onClick={() => setFollowModalType('followers')}
                className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200 hover:text-brand-500 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-purple-500" />
                <span>{followersCount}</span>
                <span className="text-slate-400 font-normal">Followers</span>
              </button>
              <button
                onClick={() => setFollowModalType('following')}
                className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200 hover:text-brand-500 transition-colors cursor-pointer"
              >
                <span>{followingCount}</span>
                <span className="text-slate-400 font-normal">Following</span>
              </button>
            </div>
          </div>

          {isOwnProfile ? (
            <Button onClick={handleOpenEditProfile} variant="outline" size="sm" className="shrink-0">
              <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit Profile
            </Button>
          ) : (
            <div className="shrink-0 flex items-center gap-2">
              <Button
                onClick={() => navigate('/messages', { state: { startChatWith: user } })}
                size="sm"
                variant="outline"
                className="flex items-center gap-1.5 border-brand-500/30 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40"
              >
                <MessageSquare className="w-4 h-4" /> Message
              </Button>

              {isFollowingUser ? (
                <Button
                  onClick={() => unfollowUser(activeUserId)}
                  disabled={isUnfollowingLoading}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5 border-brand-500/40 text-brand-500 hover:bg-red-50 hover:border-red-500 hover:text-red-500"
                >
                  <UserCheck className="w-4 h-4" /> Following
                </Button>
              ) : (
                <Button
                  onClick={() => followUser(activeUserId)}
                  disabled={isFollowingLoading}
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Follow
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

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
      <div ref={tabsRef} className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content: Overview */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bio & Details */}
          <Card className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-500" /> About
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {profile?.bio || 'No bio added yet.'}
            </p>
            {profile?.institution && (
              <div className="pt-2 text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Institution:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{profile.institution}</p>
              </div>
            )}
            {profile?.stream && (
              <div className="pt-2 text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Stream:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{profile.stream}</p>
              </div>
            )}
          </Card>

          {/* Badges / Stats */}
          <Card className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> Achievements
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="amber">🔥 {user?.reputation || 0} Pts</Badge>
              <Badge variant="emerald">Level: {user?.level || 'Beginner'}</Badge>
              {isTeacher && <Badge variant="indigo">Instructor</Badge>}
            </div>
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
