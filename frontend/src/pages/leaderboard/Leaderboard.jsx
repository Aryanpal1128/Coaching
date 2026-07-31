import React, { useState } from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { StatCard } from '../../components/common/StatCard.jsx';
import { Trophy, Users, Zap, TrendingUp } from 'lucide-react';
import {
  useGetOverallLeaderboardQuery,
  useGetWeeklyLeaderboardQuery,
  useGetMonthlyLeaderboardQuery
} from '../../redux/api/leaderboardApi.js';

const MOCK_LEADERS = [
  { _id: '1', name: 'Prof. Alan Turing', avatar: '', reputation: 850, level: 'Expert', badge: '🔥 Expert', weeklyPoints: 120 },
  { _id: '2', name: 'Ada Lovelace', avatar: '', reputation: 540, level: 'Master', badge: '⚡ Master', weeklyPoints: 95 },
  { _id: '3', name: 'Grace Hopper', avatar: '', reputation: 390, level: 'Contributor', badge: '📘 Contributor', weeklyPoints: 72 },
  { _id: '4', name: 'Charles Babbage', avatar: '', reputation: 280, level: 'Learner', badge: '🌱 Learner', weeklyPoints: 55 },
  { _id: '5', name: 'Linus Torvalds', avatar: '', reputation: 210, level: 'Learner', badge: '🌱 Learner', weeklyPoints: 40 },
];

const TABS = ['weekly', 'monthly', 'overall'];

const getRankEmoji = (index) => {
  if (index === 0) return '🏆';
  if (index === 1) return '🥇';
  if (index === 2) return '🥈';
  return null;
};

const getInitials = (name) =>
  name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

const AVATAR_COLORS = [
  'from-amber-500 to-orange-600',
  'from-brand-600 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-purple-600 to-pink-600',
  'from-red-500 to-rose-600'
];

export const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState('weekly');

  const { data: overallRes, isLoading: overallLoading } = useGetOverallLeaderboardQuery();
  const { data: weeklyRes, isLoading: weeklyLoading } = useGetWeeklyLeaderboardQuery();
  const { data: monthlyRes, isLoading: monthlyLoading } = useGetMonthlyLeaderboardQuery();

  const isLoading =
    (activeTab === 'weekly' && weeklyLoading) ||
    (activeTab === 'monthly' && monthlyLoading) ||
    (activeTab === 'overall' && overallLoading);

  const getData = () => {
    if (activeTab === 'weekly') return weeklyRes?.data || MOCK_LEADERS;
    if (activeTab === 'monthly') return monthlyRes?.data || MOCK_LEADERS;
    return overallRes?.data || MOCK_LEADERS;
  };

  const leaders = getData();
  const topThree = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 p-6 sm:p-8 text-white shadow-xl shadow-orange-500/10">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              Gamified Ranking
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold">Global Community Leaderboard</h2>
            <p className="text-xs sm:text-sm text-amber-100 mt-1 max-w-xl">
              Earn points by answering questions, receiving upvotes & getting teacher endorsements!
            </p>
          </div>
          <Trophy className="w-16 h-16 text-amber-200/80 hidden sm:block shrink-0" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Community Members" value="185" icon={Users} color="blue" />
        <StatCard title="Questions Answered" value="210" icon={Zap} color="amber" />
        <StatCard title="Top Weekly Points" value={`${leaders[0]?.weeklyPoints || leaders[0]?.reputation || 0} pts`} icon={TrendingUp} color="emerald" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold capitalize transition-all ${
              activeTab === tab
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab} Rankings
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {/* Reorder for podium: 2nd, 1st, 3rd */}
              {[topThree[1], topThree[0], topThree[2]].map((user, podiumIdx) => {
                if (!user) return <div key={podiumIdx} />;
                const realIdx = podiumIdx === 1 ? 0 : podiumIdx === 0 ? 1 : 2;
                const heights = ['h-24', 'h-32', 'h-20'];
                const medalColors = ['border-slate-300', 'border-amber-400', 'border-orange-300'];

                return (
                  <div key={user._id} className={`flex flex-col items-center justify-end ${heights[podiumIdx]}`}>
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr ${AVATAR_COLORS[realIdx]} text-white flex items-center justify-center text-sm font-extrabold border-2 ${medalColors[podiumIdx]} shadow-lg mb-1.5`}>
                      {getInitials(user.name)}
                    </div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 text-center leading-tight truncate w-full px-1">
                      {getRankEmoji(realIdx)} {user.name.split(' ')[0]}
                    </p>
                    <p className="text-[10px] font-bold text-amber-500">
                      {user.reputation || user.weeklyPoints || 0} pts
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full list */}
          <div className="space-y-2.5">
            {leaders.map((person, idx) => (
              <Card
                key={person._id}
                className={`flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 transition-all ${
                  idx === 0 ? 'border-2 border-amber-500/40 bg-amber-500/5' : 'hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {/* Rank */}
                <div className="w-7 text-center shrink-0">
                  {getRankEmoji(idx) ? (
                    <span className="text-xl">{getRankEmoji(idx)}</span>
                  ) : (
                    <span className="text-sm font-extrabold text-slate-400">#{idx + 1}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} text-white flex items-center justify-center text-xs font-extrabold shrink-0 shadow-sm`}>
                  {getInitials(person.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {person.name}
                    </h4>
                    <Badge variant="blue" size="xs">{person.level || 'Contributor'}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{person.badge}</p>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <span className="text-base sm:text-lg font-extrabold text-amber-500">
                    ⚡ {person.reputation || person.weeklyPoints || 0}
                  </span>
                  <p className="text-[10px] text-slate-400">pts</p>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
