import React from 'react';
import { useSelector } from 'react-redux';
import { StatCard } from '../../components/common/StatCard.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Trophy, HelpCircle, CheckCircle, Cpu, Zap, Flame, Award, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';

const mockWeeklyData = [
  { day: 'Mon', questions: 3, answers: 5, aiScore: 88 },
  { day: 'Tue', questions: 2, answers: 7, aiScore: 92 },
  { day: 'Wed', questions: 5, answers: 4, aiScore: 85 },
  { day: 'Thu', questions: 1, answers: 8, aiScore: 95 },
  { day: 'Fri', questions: 4, answers: 6, aiScore: 90 },
  { day: 'Sat', questions: 6, answers: 9, aiScore: 94 },
  { day: 'Sun', questions: 2, answers: 3, aiScore: 89 }
];

export const StudentDashboard = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-xl shadow-brand-500/10">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {user?.level || 'Contributor'} Level
              </span>
              <span className="text-amber-300 font-bold text-xs">🔥 5 Day Streak</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-2">
              Welcome back, {user?.name || 'Student'}! 👋
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
              You are in the top 15% of contributors this week. Keep answering questions to earn badges & reach Expert level!
            </p>
          </div>
          <Link
            to="/ask-question"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-brand-600 font-extrabold text-xs shadow-lg hover:bg-slate-100 transition-all shrink-0"
          >
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> Ask Question Now
          </Link>
        </div>
      </div>

      {/* Analytics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reputation"
          value={`${user?.reputation || 350} pts`}
          icon={Trophy}
          trend="+45 this week"
          color="amber"
        />
        <StatCard
          title="AI Accuracy Avg"
          value="91.5%"
          icon={Cpu}
          trend="Top 10% Platform"
          color="indigo"
        />
        <StatCard
          title="Questions Solved"
          value="18"
          icon={CheckCircle}
          trend="82% resolution rate"
          color="emerald"
        />
        <StatCard
          title="Answers Given"
          value="24"
          icon={HelpCircle}
          trend="+6 teacher endorsed"
          color="blue"
        />
      </div>

      {/* Analytics Chart & Badges Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Bar Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Weekly Activity & AI Performance
              </h3>
              <p className="text-xs text-slate-500">Track questions answered and AI grade trend</p>
            </div>
            <Badge variant="blue">This Week</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockWeeklyData}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="answers" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Answers" />
                <Bar dataKey="questions" fill="#6366f1" radius={[6, 6, 0, 0]} name="Questions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Gamified Badges */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Earned Badges
            </h3>
            <span className="text-xs font-bold text-brand-500">4 / 10</span>
          </div>

          <div className="space-y-3">
            {[
              { name: '🌱 Beginner', desc: 'Joined platform', date: 'Unlocked' },
              { name: '📘 Learner', desc: 'Reached 100 points', date: 'Unlocked' },
              { name: '⚡ Contributor', desc: 'Reached 300 points', date: 'Unlocked' },
              { name: '🤖 AI Master', desc: '3+ AI Scores > 90%', date: 'Unlocked' }
            ].map((badge, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {badge.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">{badge.desc}</p>
                </div>
                <Badge variant="emerald" size="xs">
                  {badge.date}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recommended Questions Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Recommended Questions for You
            </h3>
            <p className="text-xs text-slate-500">Based on your interests in Algorithms and Web Systems</p>
          </div>
          <Link to="/questions" className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1">
            View All <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {[
            {
              id: '1',
              title: 'What is the time complexity of QuickSort worst-case vs average-case?',
              subject: 'Computer Science',
              answers: 4,
              difficulty: 'Medium'
            },
            {
              id: '2',
              title: 'How to implement JWT Refresh Token rotation safely in Express?',
              subject: 'Web Systems',
              answers: 2,
              difficulty: 'Hard'
            }
          ].map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
            >
              <div>
                <Link
                  to={`/questions/${item.id}`}
                  className="text-xs font-bold text-slate-900 dark:text-slate-100 hover:text-brand-500 transition-colors"
                >
                  {item.title}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="indigo" size="xs">
                    {item.subject}
                  </Badge>
                  <span className="text-[11px] text-slate-500">{item.answers} Answers</span>
                </div>
              </div>
              <Badge variant="amber" size="xs">
                {item.difficulty}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
