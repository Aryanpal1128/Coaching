import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { StatCard } from '../../components/common/StatCard.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { ScheduleClassModal } from '../../components/liveClasses/ScheduleClassModal.jsx';
import { UploadMaterialModal } from '../../components/studyMaterials/UploadMaterialModal.jsx';
import {
  Users, Video, BookOpen, Star, Calendar, FileText, ArrowUpRight, Plus, Upload
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useGetLiveClassesQuery,
  useStartLiveClassMutation,
  useCancelLiveClassMutation,
  useStartInstantLiveClassMutation
} from '../../redux/api/liveClassApi.js';
import { useGetStudyMaterialsQuery } from '../../redux/api/teacherApi.js';
import toast from 'react-hot-toast';

export const TeacherDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Fetch teacher's own classes
  const { data: classesData } = useGetLiveClassesQuery({ teacherId: user?._id }, { skip: !user?._id });
  const allClasses = classesData?.data || [];

  // Fetch teacher's own materials
  const { data: materialsData } = useGetStudyMaterialsQuery({ teacherId: user?._id }, { skip: !user?._id });
  const allMaterials = materialsData?.data || [];

  const [startClass, { isLoading: starting }] = useStartLiveClassMutation();
  const [cancelClass] = useCancelLiveClassMutation();
  const [startInstantLiveClass, { isLoading: isStartingInstant }] = useStartInstantLiveClassMutation();

  const handleGoLiveInstantly = async () => {
    try {
      const res = await startInstantLiveClass().unwrap();
      toast.success('Instant live class created! Opening room... 🔴');
      navigate(`/live-classes?join=${res.data._id}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to start instant class');
    }
  };

  const upcomingClasses = allClasses.filter((c) => c.status === 'SCHEDULED' || c.status === 'LIVE');
  const liveCount = allClasses.filter((c) => c.status === 'LIVE').length;
  const scheduledCount = allClasses.filter((c) => c.status === 'SCHEDULED').length;
  const recentMaterials = [...allMaterials].slice(0, 4);

  const handleStart = async (cls) => {
    try {
      await startClass(cls._id).unwrap();
      toast.success('Class is now LIVE! 🔴');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to start class');
    }
  };

  const handleCancel = async (cls) => {
    if (!confirm(`Cancel "${cls.title}"?`)) return;
    try {
      await cancelClass(cls._id).unwrap();
      toast.success('Class cancelled.');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to cancel class');
    }
  };

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
              Manage your live class schedules, study resources, and student Q&A.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-500 font-bold border-0 text-white shadow-lg shadow-red-500/20"
              onClick={handleGoLiveInstantly}
              disabled={isStartingInstant}
            >
              <Video className="w-4 h-4 mr-2" /> {isStartingInstant ? 'Starting...' : '⚡ Go Live Instantly'}
            </Button>
            <Button
              variant="primary"
              className="bg-white !text-indigo-900 hover:bg-slate-100 font-bold border-0"
              onClick={() => setShowScheduleModal(true)}
            >
              <Video className="w-4 h-4 mr-2 text-indigo-600" /> Schedule Class
            </Button>
            <Button
              variant="primary"
              className="bg-white/20 hover:bg-white/30 font-bold border-0 backdrop-blur-md"
              onClick={() => setShowUploadModal(true)}
            >
              <Upload className="w-4 h-4 mr-2" /> Upload Material
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Live Classes"
          value={allClasses.length.toString()}
          icon={Video}
          color="indigo"
          trend={`${liveCount} live now • ${scheduledCount} upcoming`}
        />
        <StatCard
          title="Study Materials"
          value={allMaterials.length.toString()}
          icon={BookOpen}
          color="emerald"
          trend={recentMaterials.length > 0 ? `Latest: ${recentMaterials[0]?.fileType}` : 'Upload materials'}
        />
        <StatCard
          title="Total Attendees"
          value={allClasses.reduce((acc, c) => acc + (c.attendeesCount || 0), 0).toString()}
          icon={Users}
          color="blue"
          trend="Across all sessions"
        />
        <StatCard
          title="Reputation"
          value={user?.reputation?.toString() || '0'}
          icon={Star}
          color="amber"
          trend={user?.badge || user?.level || 'Keep going!'}
        />
      </div>

      {/* Live Classes & Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming/Live Classes */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" /> My Classes
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowScheduleModal(true)}
                className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                title="Schedule new class"
              >
                <Plus className="w-4 h-4" />
              </button>
              <Link to="/live-classes" className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1">
                Manage All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {upcomingClasses.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Video className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No upcoming classes</p>
              <Button size="sm" variant="primary" className="mt-3 bg-indigo-600" onClick={() => setShowScheduleModal(true)}>
                Schedule First Class
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingClasses.slice(0, 3).map((cls) => (
                <div key={cls._id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-1">{cls.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {new Date(cls.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        {' • '}{cls.subject?.name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {cls.status === 'LIVE' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                          LIVE
                        </span>
                      )}
                      <div className="flex gap-1.5">
                        {cls.status === 'SCHEDULED' && (
                          <>
                            <Button size="sm" variant="primary" className="bg-emerald-600 hover:bg-emerald-500 text-[10px] px-2 py-1" onClick={() => handleStart(cls)} disabled={starting}>
                              Start
                            </Button>
                            <Button size="sm" variant="danger" className="text-[10px] px-2 py-1" onClick={() => handleCancel(cls)}>
                              Cancel
                            </Button>
                          </>
                        )}
                        {cls.status === 'LIVE' && (
                          <Link to="/live-classes">
                            <Button size="sm" variant="primary" className="text-[10px] px-2 py-1">
                              Manage
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {upcomingClasses.length > 3 && (
                <Link to="/live-classes" className="block text-center text-xs text-brand-500 hover:underline pt-1">
                  +{upcomingClasses.length - 3} more classes
                </Link>
              )}
            </div>
          )}
        </Card>

        {/* Recent Materials */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" /> My Materials
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                title="Upload material"
              >
                <Plus className="w-4 h-4" />
              </button>
              <Link to="/study-materials" className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1">
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {recentMaterials.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No materials uploaded yet</p>
              <Button size="sm" variant="primary" className="mt-3 bg-emerald-600" onClick={() => setShowUploadModal(true)}>
                Upload First Material
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMaterials.map((mat) => (
                <div key={mat._id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug truncate">{mat.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {mat.subject?.name} • {new Date(mat.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                  <Badge variant={mat.fileType === 'PDF' ? 'blue' : mat.fileType === 'IMAGE' ? 'indigo' : 'emerald'} size="xs" className="shrink-0">
                    {mat.fileType}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Q&A section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Student Q&A Requires Attention
          </h3>
          <Link to="/questions" className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1">
            View All Q&A <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="text-center py-6 text-slate-400">
          <p className="text-xs">Head to the Q&A Feed to answer student questions</p>
          <Link to="/questions">
            <Button size="sm" variant="outline" className="mt-3">Go to Q&A Feed</Button>
          </Link>
        </div>
      </Card>

      {showScheduleModal && <ScheduleClassModal onClose={() => setShowScheduleModal(false)} />}
      {showUploadModal && <UploadMaterialModal onClose={() => setShowUploadModal(false)} />}
    </div>
  );
};
