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
      {/* Welcome Banner — premium card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8 shadow-theme dark:shadow-2xl border border-theme-border bg-theme-card"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-theme-indigo/10 dark:from-[#C5A059]/10 via-transparent to-transparent opacity-50 z-0" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="flex-1 flex flex-col items-start z-10 w-full md:max-w-md">
            <div className="flex items-center gap-3">
              <span className="bg-theme-badge-amber dark:bg-[#1C1F26] border border-theme-amber/20 dark:border-[#C5A059]/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-theme-amber shadow-sm dark:shadow-[0_0_10px_rgba(197,160,89,0.2)]">
                {user?.level || 'Beginner'} Level
              </span>
              <span className="text-theme-amber font-bold text-xs flex items-center gap-1">🌱 {user?.level || 'Beginner'}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold mt-5 text-theme-primary leading-tight tracking-tight">
              Welcome back,<br />
              <span className="uppercase text-theme-indigo dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-slate-400">{user?.name || 'Student'}!</span>
            </h2>
            <div className="text-3xl mt-2 mb-4 animate-wave origin-bottom-right">👋</div>

            <div className="flex items-center gap-2 text-xs text-theme-secondary font-medium mt-1">
              <CalendarCheck className="w-4 h-4 text-theme-secondary opacity-70" />
              {liveClasses.length > 0
                ? `${liveClasses.length} class${liveClasses.length > 1 ? 'es are' : ' is'} LIVE right now!`
                : upcomingClasses.length > 0
                  ? `${upcomingClasses.length} class${upcomingClasses.length > 1 ? 'es' : ''} coming up. Keep learning!`
                  : 'Ready to learn something new?'}
            </div>

            <Link
              to="/ask-question"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-b from-[#F3E5AB] to-[#C5A059] text-black font-extrabold text-sm shadow-[0_0_15px_rgba(197,160,89,0.3)] hover:scale-105 active:scale-95 transition-all shrink-0 w-fit border border-[#F3E5AB]/50"
            >
              <Zap className="w-4 h-4 fill-black" weight="fill" /> Ask Question
            </Link>
          </div>

          {/* 3D Illustration - Ambient background on mobile, side feature on desktop */}
          <div className="absolute -right-16 -bottom-16 w-80 h-80 opacity-30 pointer-events-none z-0 
                          md:relative md:right-auto md:bottom-auto md:opacity-100 md:pointer-events-auto md:z-10 md:w-1/2 md:flex md:justify-end md:mt-0">
            <div className="relative w-full h-full md:w-56 md:h-56 lg:w-64 lg:h-64 md:rounded-2xl md:overflow-hidden md:shadow-2xl md:border md:border-theme-border">
              <img
                src="/assets/hero_illustration.jpg"
                alt="Graduation Cap"
                className="w-full h-full object-cover md:rounded-2xl opacity-100 hover:opacity-100 transition-opacity [mask-image:radial-gradient(circle_at_center,black_40%,transparent_70%)] md:[mask-image:none] mix-blend-multiply dark:mix-blend-normal"
              />
              <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-theme-card/60 dark:from-theme-card/80 via-transparent to-transparent opacity-80" />
            </div>
          </div>
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

      {/* Stat Cards — stacked vertically on mobile */}
      <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              color="amber"
              onClick={() => { }}
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
              onClick={() => { }}
            />
          </Link>
        </motion.div>
      </div>

      {/* Recent Questions from Q&A */}
      <div className="hidden md:block">
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
    </div>
  );
};
