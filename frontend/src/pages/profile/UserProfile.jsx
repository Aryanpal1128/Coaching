import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { StatCard } from '../../components/common/StatCard.jsx';
import {
  Mail, Trophy, Award, BookOpen, CheckCircle, Flame,
  Edit, Camera, HelpCircle, MessageSquare, Cpu
} from 'lucide-react';

const BADGES_LIST = [
  { name: '🌱 Beginner', desc: 'Joined platform', unlocked: true },
  { name: '📘 Learner', desc: 'Reached 100 pts', unlocked: true },
  { name: '⚡ Contributor', desc: 'Reached 300 pts', unlocked: true },
  { name: '🤖 AI Master', desc: '3+ AI Scores > 90%', unlocked: true },
  { name: '🔥 Expert', desc: 'Reached 1000 pts', unlocked: false },
  { name: '🏆 Legend', desc: 'Top 3 Leaderboard', unlocked: false }
];

const ACTIVITY_TABS = ['Overview', 'Questions', 'Answers'];

const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

export const UserProfile = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('Overview');

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
            <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-white dark:bg-slate-800 border-2 border-brand-500 shadow-md hover:bg-slate-50 transition-colors">
              <Camera className="w-3.5 h-3.5 text-brand-500" />
            </button>
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

            <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 mt-1">
              <Mail className="w-3.5 h-3.5" /> {user?.email || 'email@example.com'}
            </p>

            {/* Reputation stats row */}
            <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-amber-500">
                <Trophy className="w-4 h-4" /> {user?.reputation || 0} Reputation Pts
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-brand-500">
                <Award className="w-4 h-4" /> {user?.badge || '🌱 Beginner'}
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-red-500">
                <Flame className="w-4 h-4" /> 5 Day Streak
              </span>
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

          <Button variant="outline" size="sm" className="shrink-0">
            <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit Profile
          </Button>
        </div>
      </Card>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Questions Asked" value="12" icon={HelpCircle} color="blue" trend="3 this month" />
        <StatCard title="Answers Contributed" value="24" icon={MessageSquare} color="indigo" trend="Top 15% platform" />
        <StatCard title="AI Accuracy Avg" value="91.5%" icon={Cpu} color="amber" trend="Top 10% platform" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {ACTIVITY_TABS.map((tab) => (
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

          {/* Recent Activity */}
          <Card>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-brand-500" /> Recent Activity
            </h3>
            <div className="space-y-3">
              {[
                { action: '🤖 AI graded your answer with 95% accuracy', time: '2 hours ago', color: 'purple' },
                { action: '✅ Your answer was accepted as solution', time: 'Yesterday', color: 'emerald' },
                { action: '⚡ Received upvote on Graph Algorithms answer', time: '2 days ago', color: 'blue' },
                { action: '🏆 Earned AI Master badge', time: '3 days ago', color: 'amber' },
                { action: '📘 Asked question on Red-Black Trees', time: '5 days ago', color: 'indigo' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-800 dark:text-slate-200">{item.action}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'Questions' && (
        <Card>
          <p className="text-sm text-slate-500 text-center py-8">
            Connect to MongoDB to see your actual question history.
          </p>
        </Card>
      )}

      {activeTab === 'Answers' && (
        <Card>
          <p className="text-sm text-slate-500 text-center py-8">
            Connect to MongoDB to see your actual answer history.
          </p>
        </Card>
      )}
    </div>
  );
};
