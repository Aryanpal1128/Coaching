import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { StatCard } from '../../components/common/StatCard.jsx';
import {
  Mail, Trophy, Award, BookOpen, CheckCircle, Flame,
  Edit, Camera, HelpCircle, MessageSquare, Cpu, Bookmark, UserPlus, UserCheck, UserX, Users, X
} from 'lucide-react';
import { useGetUserProfileQuery } from '../../redux/api/authApi.js';
import { QuestionCard } from '../../components/questions/QuestionCard.jsx';
import { useSearchQuestionsQuery } from '../../redux/api/questionApi.js';
import {
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useGetFollowCountsQuery
} from '../../redux/api/followApi.js';

const BADGES_LIST = [
  { name: '🌱 Beginner', desc: 'Joined platform', unlocked: true },
  { name: '📘 Learner', desc: 'Reached 100 pts', unlocked: true },
  { name: '⚡ Contributor', desc: 'Reached 300 pts', unlocked: true },
  { name: '🤖 AI Master', desc: '3+ AI Scores > 90%', unlocked: true },
  { name: '🔥 Expert', desc: 'Reached 1000 pts', unlocked: false },
  { name: '🏆 Legend', desc: 'Top 3 Leaderboard', unlocked: false }
];

const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

export const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('Overview');
  const [followModalType, setFollowModalType] = useState(null); // 'followers' | 'following' | null

  const activeUserId = userId || currentUser?._id;
  const isOwnProfile = !userId || userId === currentUser?._id;

  const { data: profileResponse, isLoading, error } = useGetUserProfileQuery(activeUserId, {
    skip: !activeUserId
  });

  const { data: countsData } = useGetFollowCountsQuery(activeUserId, {
    skip: !activeUserId
  });
  const followersCount = countsData?.data?.followers || 0;
  const followingCount = countsData?.data?.following || 0;
  const isFollowingUser = countsData?.data?.isFollowing || false;

  const [followUser, { isLoading: isFollowingLoading }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: isUnfollowingLoading }] = useUnfollowUserMutation();

  const user = isOwnProfile ? currentUser : profileResponse?.data?.user;
  const profile = profileResponse?.data?.profile;

  const isStudent = user?.role === 'STUDENT';
  const tabs = isStudent
    ? ['Overview', 'Questions Asked', 'Saved Questions']
    : ['Overview', 'Questions Asked'];

  const { data: askedQuestionsRes, isLoading: askedLoading } = useSearchQuestionsQuery(
    { askedBy: activeUserId },
    { skip: !activeUserId }
  );
  const askedQuestions = askedQuestionsRes?.data?.questions || [];

  const { data: savedQuestionsRes, isLoading: savedLoading } = useSearchQuestionsQuery(
    { bookmarkedBy: activeUserId },
    { skip: !activeUserId || !isStudent }
  );
  const savedQuestions = savedQuestionsRes?.data?.questions || [];

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Hero Card */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-brand-500 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold border-4 border-brand-500 shadow-xl">
                {getInitials(user?.name)}
              </div>
            )}
            {isOwnProfile && (
              <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-white dark:bg-slate-800 border-2 border-brand-500 shadow-md hover:bg-slate-50 transition-colors">
                <Camera className="w-3.5 h-3.5 text-brand-500" />
              </button>
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
                className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200 hover:text-brand-500 transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-purple-500" />
                <span>{followersCount}</span>
                <span className="text-slate-400 font-normal">Followers</span>
              </button>
              <button
                onClick={() => setFollowModalType('following')}
                className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200 hover:text-brand-500 transition-colors"
              >
                <span>{followingCount}</span>
                <span className="text-slate-400 font-normal">Following</span>
              </button>
            </div>

            {/* Progress bar to next level */}
            <div className="mt-4 max-w-sm mx-auto sm:mx-0">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                <span>Progress to next level</span>
                <span className="font-bold text-brand-500">{user?.reputation || 0} / 1000 pts</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all"
                  style={{ width: `${Math.min(((user?.reputation || 0) / 1000) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {isOwnProfile ? (
            <Button variant="outline" size="sm" className="shrink-0">
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

      {/* Activity Stats */}
      {user?.role !== 'TEACHER' && user?.role !== 'ADMIN' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Questions Asked" value={profile?.askedQuestionsCount?.toString() || "0"} icon={HelpCircle} color="blue" trend="Created by user" />
          <StatCard title="Answers Contributed" value={profile?.answersCount?.toString() || "0"} icon={MessageSquare} color="indigo" trend="Helped others learn" />
          <StatCard title="Solved Questions" value={profile?.solvedQuestionsCount?.toString() || "0"} icon={CheckCircle} color="emerald" trend="Completed solutions" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Experience" value={`${profile?.experienceYears || 0} Years`} icon={Flame} color="amber" trend="Teaching experience" />
          <StatCard title="Students Enrolled" value={profile?.enrolledStudents?.length?.toString() || "0"} icon={BookOpen} color="blue" trend="Active students" />
          <StatCard title="Followers" value={profile?.followers?.length?.toString() || "0"} icon={MessageSquare} color="indigo" trend="Coaching community" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === tab
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Badges */}
          <Card>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-amber-500" /> Badges & Achievements
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {BADGES_LIST.map((badge, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border transition-all ${
                    badge.unlocked
                      ? 'bg-amber-500/5 border-amber-500/20 text-slate-900 dark:text-slate-100'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-40 grayscale'
                  }`}
                >
                  <p className="text-sm font-bold">{badge.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{badge.desc}</p>
                  {badge.unlocked && (
                    <span className="inline-block mt-1.5 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                      ✓ Unlocked
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Details / Subject list */}
          <Card>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-brand-500" /> Academic Profile
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Institution</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {profile?.institution || 'AI Learning Academy'}
                </p>
              </div>
              {user?.role !== 'TEACHER' ? (
                <>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grade / Year</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {profile?.gradeOrYear || 'High School / Freshman'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subjects of Interest</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {profile?.subjectsOfInterest && profile.subjectsOfInterest.length > 0 ? (
                        profile.subjectsOfInterest.map((s) => (
                          <Badge key={s._id} variant="indigo">{s.name}</Badge>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">No subjects listed yet</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qualification</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {profile?.qualification || 'PhD / Masters'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subjects Taught</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {profile?.subjectsTaught && profile.subjectsTaught.length > 0 ? (
                        profile.subjectsTaught.map((s) => (
                          <Badge key={s._id} variant="indigo">{s.name}</Badge>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">No subjects listed yet</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'Questions Asked' && (
        <div className="space-y-4">
          {askedLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
              ))}
            </div>
          ) : askedQuestions.length === 0 ? (
            <Card className="p-8 text-center">
              <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No questions asked yet</p>
            </Card>
          ) : (
            askedQuestions.map((q) => (
              <QuestionCard key={q._id} question={q} />
            ))
          )}
        </div>
      )}

      {activeTab === 'Saved Questions' && isStudent && (
        <div className="space-y-4">
          {savedLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
              ))}
            </div>
          ) : savedQuestions.length === 0 ? (
            <Card className="p-8 text-center">
              <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No saved questions yet</p>
            </Card>
          ) : (
            savedQuestions.map((q) => (
              <QuestionCard key={q._id} question={q} />
            ))
          )}
        </div>
      )}

      {/* Followers / Following Modal */}
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

const FollowListModal = ({ userId, type, onClose }) => {
  const isFollowers = type === 'followers';
  const { data: followersRes, isLoading: followersLoading } = useGetFollowersQuery(userId, { skip: !isFollowers });
  const { data: followingRes, isLoading: followingLoading } = useGetFollowingQuery(userId, { skip: isFollowers });

  const list = isFollowers ? followersRes?.data?.users || [] : followingRes?.data?.users || [];
  const isLoading = isFollowers ? followersLoading : followingLoading;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 capitalize flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-500" /> {type}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">No {type} yet</p>
          ) : (
            list.map((u) => (
              <div key={u._id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <Link
                  to={`/profile/${u._id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <img
                    src={u.avatar || 'https://res.cloudinary.com/demo/image/upload/v1571218039/sample.jpg'}
                    alt={u.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate hover:underline">
                      {u.name}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize">{u.role}</p>
                  </div>
                </Link>
                <Link
                  to={`/profile/${u._id}`}
                  onClick={onClose}
                  className="px-3 py-1 rounded-xl bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 text-xs font-bold shrink-0"
                >
                  View
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
