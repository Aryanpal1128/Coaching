import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { StatCard } from '../../components/common/StatCard.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { HelpCircle, CheckCircle, Zap, ArrowUpRight } from 'lucide-react';
import { Trophy as PhosphorTrophy, VideoCamera, BookOpen as PhosphorBookOpen, CalendarCheck } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useGetLiveClassesQuery } from '../../redux/api/liveClassApi.js';
import { useGetStudyMaterialsQuery } from '../../redux/api/teacherApi.js';
import { useSearchQuestionsQuery } from '../../redux/api/questionApi.js';

export const StudentDashboard = () => {
  const { user } = useSelector((state) => state.auth);

  // Fetch real data
  const { data: liveClassData } = useGetLiveClassesQuery({ status: 'LIVE' });
  const { data: scheduledData } = useGetLiveClassesQuery({ status: 'SCHEDULED' });
  const { data: materialsData } = useGetStudyMaterialsQuery({});
  const { data: questionsData } = useSearchQuestionsQuery({ limit: 6 });

  const liveClasses = Array.isArray(liveClassData?.data)
    ? liveClassData.data
    : [];

  const upcomingClasses = Array.isArray(scheduledData?.data)
    ? scheduledData.data
    : [];

  const materials = Array.isArray(materialsData?.data)
    ? materialsData.data
    : [];

  const recentQuestions = Array.isArray(questionsData?.data)
    ? questionsData.data
    : Array.isArray(questionsData?.questions)
      ? questionsData.questions
      : [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner — flat brand color */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-3xl bg-brand-600 dark:bg-brand-700 p-6 sm:p-8 text-white shadow-lg shadow-brand-500/10"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {user?.level || 'Beginner'} Level
              </span>
              {user?.badge && (
                <span className="text-amber-300 font-bold text-xs">{user.badge}</span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-2">
              Welcome back, {user?.name || 'Student'}! 👋
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
              {liveClasses.length > 0
                ? `🔴 ${liveClasses.length} class${liveClasses.length > 1 ? 'es are' : ' is'} LIVE right now — join before it ends!`
                : upcomingClasses.length > 0
                  ? `📅 ${upcomingClasses.length} class${upcomingClasses.length > 1 ? 'es' : ''} coming up. Keep learning!`
                  : 'Ask questions, answer your peers, and climb the leaderboard!'}
            </p>
          </div>
          <Link
            to="/ask-question"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-brand-600 font-extrabold text-xs shadow-lg hover:bg-slate-100 transition-all shrink-0"
          >
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> Ask Question
          </Link>
        </div>
      </motion.div>

      {/* 🔴 Active Live Class Banner */}
      {liveClasses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.04 }}
          className="bg-red-500/10 border border-red-500/30 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse"
        >
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <div>
              <h3 className="text-xs font-black text-red-500 uppercase tracking-wider">Live Class In Progress</h3>
              <p className="text-xs text-slate-800 dark:text-slate-200 font-extrabold mt-0.5">
                "{liveClasses[0].title}" by {liveClasses[0].teacher?.name} ({liveClasses[0].subject?.name})
              </p>
            </div>
          </div>
          <Link
            to={`/live-classes?join=${liveClasses[0]._id}`}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg shadow-red-500/20 transition-all shrink-0 uppercase tracking-wider"
          >
            Join Live Class Now →
          </Link>
        </motion.div>
      )}

      {/* Stat Cards — real user data with staggered entrance & distinct accent tints */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Reputation Points (Teal/Emerald) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06 }}
        >
          <StatCard
            title="Reputation Points"
            value={`${user?.reputation || 0} pts`}
            icon={PhosphorTrophy}
            trend={user?.level || 'Keep going!'}
            color="emerald"
          />
        </motion.div>

        {/* Card 2: Live Now (Coral/Rose Red + Pulsing Dot when count > 0) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12 }}
        >
          <StatCard
            title="Live Now"
            value={
              <span className="inline-flex items-center gap-2">
                {liveClasses.length > 0 && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                )}
                {liveClasses.length.toString()}
              </span>
            }
            icon={VideoCamera}
            trend={liveClasses.length > 0 ? 'Classes in progress' : 'None active'}
            color="rose"
          />
        </motion.div>

        {/* Card 3: Study Materials (Purple, Clickable -> /study-materials) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.18 }}
        >
          <Link to="/study-materials" className="block text-left font-normal">
            <StatCard
              title="Study Materials"
              value={materials.length.toString()}
              icon={PhosphorBookOpen}
              trend="Available to download"
              color="purple"
              onClick={() => {}}
            />
          </Link>
        </motion.div>

        {/* Card 4: Upcoming Classes (Slate/Neutral, Clickable -> /live-classes) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.24 }}
        >
          <Link to="/live-classes" className="block text-left font-normal">
            <StatCard
              title="Upcoming Classes"
              value={upcomingClasses.length.toString()}
              icon={CalendarCheck}
              trend="Scheduled sessions"
              color="slate"
              onClick={() => {}}
            />
          </Link>
        </motion.div>
      </div>

      {/* Recent Questions from Q&A */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.30 }}
      >
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Recent Q&A</h3>
              <p className="text-xs text-slate-500">Latest questions from the community</p>
            </div>
            <Link to="/questions" className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentQuestions.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No questions yet. Be the first to ask!</p>
                <Link to="/ask-question" className="text-xs text-brand-500 hover:underline mt-1 block">Ask a question →</Link>
              </div>
            ) : (
              recentQuestions.map((q, idx) => (
                <motion.div
                  key={q._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.32 + idx * 0.04 }}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/questions/${q._id}`}
                      className="text-xs font-bold text-slate-900 dark:text-slate-100 hover:text-brand-500 transition-colors line-clamp-1"
                    >
                      {q.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      {q.subject?.name && <Badge variant="indigo" size="xs">{q.subject.name}</Badge>}
                      <span className="text-[11px] text-slate-500">{q.answers?.length || 0} Answers</span>
                    </div>
                  </div>
                  <Badge variant={q.difficulty === 'Hard' ? 'red' : q.difficulty === 'Easy' ? 'emerald' : 'amber'} size="xs">
                    {q.difficulty || 'Medium'}
                  </Badge>
                </motion.div>
              ))
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
