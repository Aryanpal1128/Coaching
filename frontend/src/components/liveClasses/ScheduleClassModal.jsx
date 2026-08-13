import React, { useState } from 'react';
import { X, Video, Lock, Globe } from 'lucide-react';
import { Button } from '../common/Button.jsx';
import { useScheduleLiveClassMutation } from '../../redux/api/liveClassApi.js';
import { useGetSubjectsQuery } from '../../redux/api/teacherApi.js';
import { useGetMyRoomsQuery } from '../../redux/api/roomApi.js';
import toast from 'react-hot-toast';

export const ScheduleClassModal = ({ onClose }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    scheduledAt: '',
    accessType: 'public',
    roomId: ''
  });

  const [scheduleClass, { isLoading }] = useScheduleLiveClassMutation();
  const { data: subjectsData } = useGetSubjectsQuery();
  const subjects = subjectsData?.data || [];

  const { data: roomsData } = useGetMyRoomsQuery();
  const myRooms = roomsData?.data || [];

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.subject) {
      toast.error('Title and subject are required');
      return;
    }
    if (form.accessType === 'paid' && !form.roomId) {
      toast.error('Please select a paid Room for this class');
      return;
    }

    try {
      await scheduleClass({
        title: form.title,
        description: form.description,
        subject: form.subject,
        scheduledAt: form.scheduledAt,
        accessType: form.accessType,
        room: form.accessType === 'paid' ? form.roomId : undefined
      }).unwrap();
      toast.success('Live class scheduled! 🎉');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to schedule class');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl shadow-indigo-500/10 animate-fadeIn overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10">
              <Video className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Schedule Live Class</h2>
              <p className="text-xs text-slate-400">A Jitsi Meet link will be generated automatically</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Class Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Advanced Graph Algorithms"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select subject...</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Access Type Selector (Public vs Paid Room) */}
          <div className="space-y-2 p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Access Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, accessType: 'public', roomId: '' }))}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  form.accessType === 'public'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Public (Free)</span>
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, accessType: 'paid' }))}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  form.accessType === 'paid'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Paid Room</span>
              </button>
            </div>

            {form.accessType === 'paid' && (
              <div className="pt-2 animate-in fade-in duration-150">
                <label className="block text-[11px] font-bold text-amber-400 mb-1">
                  Select Target Paid Room <span className="text-red-500">*</span>
                </label>
                {myRooms.length === 0 ? (
                  <p className="text-xs text-amber-300/80 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    No paid rooms found. Create a paid room first under Teacher Dashboard or Profile.
                  </p>
                ) : (
                  <select
                    name="roomId"
                    value={form.roomId}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select Paid Room...</option>
                    {myRooms.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.title} (₹{(r.price / 100).toFixed(0)})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Scheduled At */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Schedule Date & Time
            </label>
            <input
              name="scheduledAt"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="What will be covered in this class?"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:flex-1 justify-center">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:flex-1 justify-center bg-indigo-600 hover:bg-indigo-500" disabled={isLoading}>
              {isLoading ? 'Scheduling...' : '📅 Schedule Class'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
