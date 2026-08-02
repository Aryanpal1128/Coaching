import React, { useState } from 'react';
import { X, Video, Calendar, BookOpen, FileText } from 'lucide-react';
import { Button } from '../common/Button.jsx';
import { useScheduleLiveClassMutation } from '../../redux/api/liveClassApi.js';
import { useGetSubjectsQuery } from '../../redux/api/teacherApi.js';
import toast from 'react-hot-toast';

export const ScheduleClassModal = ({ onClose }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    scheduledAt: ''
  });

  const [scheduleClass, { isLoading }] = useScheduleLiveClassMutation();
  const { data: subjectsData } = useGetSubjectsQuery();
  const subjects = subjectsData?.data || [];

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.subject) {
      toast.error('Title and subject are required');
      return;
    }
    try {
      await scheduleClass(form).unwrap();
      toast.success('Live class scheduled! 🎉');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to schedule class');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl shadow-indigo-500/10 animate-fadeIn">
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

          {/* Jitsi Info */}
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-2">
            <Video className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
            <p className="text-xs text-indigo-300">
              A <strong>Jitsi Meet</strong> room link is auto-generated for your class. No account needed — students join with one click.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1 bg-indigo-600 hover:bg-indigo-500" disabled={isLoading}>
              {isLoading ? 'Scheduling...' : '📅 Schedule Class'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
