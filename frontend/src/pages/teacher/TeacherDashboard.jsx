import React from 'react';
import { useSelector } from 'react-redux';
import { StatCard } from '../../components/common/StatCard.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Users, Video, BookOpen, Star, Calendar, FileText, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TeacherDashboard = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              Instructor Dashboard
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              {user?.name || 'Instructor'} 👨‍🏫
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-xl">
              Manage your enrolled students, live class schedules, study resources, and assignments.
            </p>
          </div>
          <Link to="/live-classes" className="shrink-0">
            <Button variant="primary" className="bg-white !text-indigo-900 hover:bg-slate-100 font-bold border-0">
              <Video className="w-4 h-4 mr-2 text-indigo-600" /> Schedule Live Class
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Enrolled Students" value="142" icon={Users} color="blue" trend="+12 this month" />
        <StatCard title="Live Classes Taught" value="28" icon={Video} color="indigo" trend="3 upcoming" />
        <StatCard title="Study Materials Uploaded" value="19" icon={BookOpen} color="emerald" trend="2 new this week" />
        <StatCard title="Endorsed Answers" value="35" icon={Star} color="amber" trend="+5 this week" />
      </div>

      {/* Upcoming Live Classes & Quick Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" /> Upcoming Scheduled Classes
            </h3>
            <Link to="/live-classes" className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1">
              Manage All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { title: 'Advanced Graph Algorithms & Proofs', time: 'Today at 4:00 PM', students: 48, status: 'live' },
              { title: 'Data Structures & Dynamic Programming', time: 'Tomorrow at 10:00 AM', students: 62, status: 'scheduled' }
            ].map((cls, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">{cls.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{cls.time} • {cls.students} Enrolled</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {cls.status === 'live' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                        LIVE
                      </span>
                    )}
                    <Button size="sm" variant="primary">Start Session</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" /> Recent Study Notes & Assignments
            </h3>
            <Link to="/study-materials" className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1">
              Upload New <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { title: 'Graph Traversal PDF Notes.pdf', type: 'PDF Notes', date: 'Uploaded yesterday', typeColor: 'blue' },
              { title: 'Assignment 3: Dijkstra Algorithm Implementation', type: 'Assignment', date: 'Due Aug 5', typeColor: 'amber' }
            ].map((mat, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug truncate">{mat.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{mat.date}</p>
                </div>
                <Badge variant={mat.typeColor} size="xs" className="shrink-0">{mat.type}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Q&A Activity */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Recent Student Questions Requiring Attention
          </h3>
          <Link to="/questions" className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1">
            View All Q&A <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="space-y-3">
          {[
            { title: 'What is the time complexity of QuickSort in worst case?', asker: 'Ada Lovelace', answers: 2, difficulty: 'Medium' },
            { title: 'How does Red-Black Tree rebalancing work after insertion?', asker: 'Grace Hopper', answers: 0, difficulty: 'Hard' }
          ].map((q, idx) => (
            <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 gap-4">
              <div className="flex-1 min-w-0">
                <Link to="/questions" className="text-xs font-bold text-slate-900 dark:text-slate-100 hover:text-brand-500 line-clamp-1 transition-colors">
                  {q.title}
                </Link>
                <p className="text-[11px] text-slate-500 mt-0.5">Asked by {q.asker} • {q.answers} answers</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={q.difficulty === 'Hard' ? 'red' : 'amber'} size="xs">{q.difficulty}</Badge>
                <Button size="sm" variant="outline">Answer</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
