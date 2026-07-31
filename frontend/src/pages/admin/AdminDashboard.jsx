import React, { useState } from 'react';
import { StatCard } from '../../components/common/StatCard.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Shield, Users, AlertTriangle, Cpu, CheckCircle2, XCircle, UserX, TrendingUp } from 'lucide-react';
import { useGetAnalyticsQuery } from '../../redux/api/adminApi.js';

const MOCK_REPORTS = [
  { id: '1', reporter: 'Student One', target: 'Question #104', reason: 'Spam / Repeated title', status: 'PENDING' },
  { id: '2', reporter: 'Ada Lovelace', target: 'Answer #52', reason: 'Inappropriate language', status: 'PENDING' }
];

const MOCK_USERS = [
  { id: '1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'STUDENT', status: 'Active', joined: '2 days ago' },
  { id: '2', name: 'Charles Babbage', email: 'charles@example.com', role: 'STUDENT', status: 'Active', joined: '1 week ago' },
  { id: '3', name: 'Dr. Grace Hopper', email: 'grace@example.com', role: 'TEACHER', status: 'Active', joined: '2 weeks ago' }
];

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState(MOCK_REPORTS);

  const { data: analyticsRes } = useGetAnalyticsQuery();
  const analytics = analyticsRes?.data || {
    users: { total: 185, students: 160, teachers: 25 },
    content: { questions: 94, answers: 210, liveClasses: 18 },
    moderation: { pendingReports: reports.length }
  };

  const dismissReport = (id) => setReports((prev) => prev.filter((r) => r.id !== id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-amber-500/30 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Badge variant="amber" size="sm" className="mb-2">Admin Control Center</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold">System Administration</h2>
            <p className="text-xs text-slate-400 mt-1">Platform analytics, user moderation, report resolutions & AI stats</p>
          </div>
          <Shield className="w-14 h-14 text-amber-500 hidden sm:block shrink-0" />
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Platform Users" value={analytics.users.total} icon={Users} color="blue" trend={`${analytics.users.students} students, ${analytics.users.teachers} teachers`} />
        <StatCard title="Questions Posted" value={analytics.content.questions} icon={CheckCircle2} color="indigo" trend={`${analytics.content.answers} answers total`} />
        <StatCard title="AI Evaluations Conducted" value={analytics.content.answers} icon={Cpu} color="emerald" trend="Gemini powered" />
        <StatCard title="Pending Reports" value={analytics.moderation.pendingReports} icon={AlertTriangle} color="amber" trend="Requires review" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'reports', label: 'Moderation Queue', count: reports.length },
          { id: 'users', label: 'User Management', count: MOCK_USERS.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === tab.id
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <Card>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Pending Content Moderation Queue
          </h3>

          {reports.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
              <p className="font-semibold text-sm">All clear! No pending reports.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{report.target}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Reported by <strong>{report.reporter}</strong> — {report.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="danger">
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Remove
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => dismissReport(report.id)}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-500" /> Registered Users
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left pb-3 font-bold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="text-left pb-3 font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                  <th className="text-left pb-3 font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="text-left pb-3 font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Joined</th>
                  <th className="text-right pb-3 font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {MOCK_USERS.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-bold text-slate-900 dark:text-slate-100">{u.name}</td>
                    <td className="py-3 text-slate-500 hidden sm:table-cell">{u.email}</td>
                    <td className="py-3">
                      <Badge variant={u.role === 'TEACHER' ? 'indigo' : 'blue'} size="xs">{u.role}</Badge>
                    </td>
                    <td className="py-3 text-slate-500 hidden md:table-cell">{u.joined}</td>
                    <td className="py-3 text-right">
                      <Button size="sm" variant="danger">
                        <UserX className="w-3.5 h-3.5 mr-1" /> Suspend
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
