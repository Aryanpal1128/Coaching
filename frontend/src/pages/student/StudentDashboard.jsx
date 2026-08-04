import React from 'react';
import { useSelector } from 'react-redux';
import { StatCard } from '../../components/common/StatCard.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Trophy, HelpCircle, CheckCircle, Cpu, Zap, Award, ArrowUpRight, Video, BookOpen } from 'lucide-react';
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
  const { data: questionsData } = useSearchQuestionsQuery({ limit: 4 });

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
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-xl shadow-brand-500/10">
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
      </div>

      {/* Stat Cards — real user data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Reputation Points"
          value={`${user?.reputation || 0} pts`}
          icon={Trophy}
          trend={user?.level || 'Keep going!'}
          color="amber"
        />
        <StatCard
          title="Live Now"
          value={liveClasses.length.toString()}
          icon={Video}
          trend={liveClasses.length > 0 ? 'Classes in progress' : 'None active'}
          color={liveClasses.length > 0 ? 'red' : 'slate'}
        />
        <StatCard
          title="Study Materials"
          value={materials.length.toString()}
          icon={BookOpen}
          trend="Available to download"
          color="emerald"
        />
        <StatCard
          title="Upcoming Classes"
          value={upcomingClasses.length.toString()}
          icon={CheckCircle}
          trend="Scheduled sessions"
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live & Upcoming Classes */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Video className="w-5 h-5 text-red-500" /> Live & Upcoming
            </h3>
            <Link to="/live-classes" className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {[...liveClasses, ...upcomingClasses].length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Video className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No classes right now</p>
              <Link to="/live-classes" className="text-xs text-brand-500 hover:underline mt-1 block">Browse all classes →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {[...liveClasses, ...upcomingClasses].slice(0, 3).map((cls) => (
                <div key={cls._id} className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 ${cls.status === 'LIVE'
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                  }`}>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{cls.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {cls.teacher?.name} • {cls.subject?.name}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {cls.status === 'LIVE' ? (
                      <Link to="/live-classes">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                          JOIN
                        </span>
                      </Link>
                    ) : (
                      <Badge variant="amber" size="xs">
                        {new Date(cls.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Study Materials */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-500" /> Study Materials
            </h3>
            <Link to="/study-materials" className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {materials.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No materials uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {materials.slice(0, 3).map((m) => (
                <a
                  key={m._id}
                  href={m.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{m.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{m.teacher?.name} • {m.subject?.name}</p>
                    </div>
                    <Badge variant="blue" size="xs">{m.fileType}</Badge>
                  </div>
                </a>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Questions from Q&A */}
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
            recentQuestions.map((q) => (
              <div key={q._id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
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
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
