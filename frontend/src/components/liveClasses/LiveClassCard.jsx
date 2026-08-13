import React from 'react';
import { Users, Video, PlayCircle, XCircle, StopCircle, ExternalLink, Clock, BookOpen } from 'lucide-react';
import { Badge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';
import {
  useStartLiveClassMutation,
  useEndLiveClassMutation,
  useCancelLiveClassMutation
} from '../../redux/api/liveClassApi.js';
import toast from 'react-hot-toast';

const statusConfig = {
  LIVE: { label: 'LIVE', variant: 'red', dot: true },
  SCHEDULED: { label: 'Scheduled', variant: 'amber' },
  ENDED: { label: 'Ended', variant: 'slate' },
  CANCELLED: { label: 'Cancelled', variant: 'slate' }
};

export const LiveClassCard = ({ cls, currentUser, onJoin }) => {
  const [startClass, { isLoading: starting }] = useStartLiveClassMutation();
  const [endClass, { isLoading: ending }] = useEndLiveClassMutation();
  const [cancelClass, { isLoading: cancelling }] = useCancelLiveClassMutation();

  const isTeacherOwner =
    currentUser?.role === 'TEACHER' &&
    cls.teacher?._id?.toString() === currentUser?._id?.toString();

  const isAdmin = currentUser?.role === 'ADMIN';
  const canControl = isTeacherOwner || isAdmin;

  const { label, variant, dot } = statusConfig[cls.status] || statusConfig.SCHEDULED;

  const handleStart = async () => {
    try {
      await startClass(cls._id).unwrap();
      toast.success('Class is now LIVE! 🔴');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to start class');
    }
  };

  const handleEnd = async () => {
    try {
      await endClass(cls._id).unwrap();
      toast.success('Class ended.');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to end class');
    }
  };

  const handleCancel = async () => {
    try {
      await cancelClass(cls._id).unwrap();
      toast.success('Class cancelled.');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to cancel class');
    }
  };

  return (
    <div id={`class-card-${cls._id}`} className={`relative p-4 rounded-2xl border transition-all ${
      cls.status === 'LIVE'
        ? 'bg-red-500/5 border-red-500/30 shadow-md shadow-red-500/10'
        : cls.status === 'SCHEDULED'
        ? 'bg-slate-900 border-slate-700 hover:border-indigo-500/40'
        : 'bg-slate-900/50 border-slate-800 opacity-70'
    }`}>
      {/* Status badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-100 leading-snug line-clamp-2">{cls.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{cls.subject?.name}</p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          {cls.accessType === 'paid' && (
            <Badge variant="amber" size="xs">PAID</Badge>
          )}
          {dot ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              LIVE
            </span>
          ) : (
            <Badge variant={variant} size="xs">{label}</Badge>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-4">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {new Date(cls.scheduledAt).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
          })}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {cls.attendeesCount || 0} attending
        </span>
        <span className="flex items-center gap-1">
          <Video className="w-3.5 h-3.5" />
          {cls.teacher?.name}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {/* Students / anyone can join a LIVE class */}
        {cls.status === 'LIVE' && (
          <Button
            size="sm"
            variant="primary"
            className="bg-red-600 hover:bg-red-500 flex-1 gap-1"
            onClick={() => onJoin(cls)}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Join Class
          </Button>
        )}

        {/* Open Jitsi link directly */}
        {cls.status === 'LIVE' && cls.meetingLink && (
          <a
            href={cls.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in Tab
          </a>
        )}

        {/* Teacher controls */}
        {canControl && cls.status === 'SCHEDULED' && (
          <>
            <Button size="sm" variant="primary" className="bg-emerald-600 hover:bg-emerald-500 gap-1" onClick={handleStart} disabled={starting}>
              <PlayCircle className="w-3.5 h-3.5" />
              {starting ? 'Starting...' : 'Start'}
            </Button>
            <Button size="sm" variant="danger" className="gap-1" onClick={handleCancel} disabled={cancelling}>
              <XCircle className="w-3.5 h-3.5" />
              Cancel
            </Button>
          </>
        )}

        {canControl && cls.status === 'LIVE' && (
          <Button size="sm" variant="danger" className="gap-1" onClick={handleEnd} disabled={ending}>
            <StopCircle className="w-3.5 h-3.5" />
            {ending ? 'Ending...' : 'End Class'}
          </Button>
        )}
      </div>
    </div>
  );
};
