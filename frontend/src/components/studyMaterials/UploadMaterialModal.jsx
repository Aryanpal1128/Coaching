import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Lock, Globe } from 'lucide-react';
import { Button } from '../common/Button.jsx';
import { useUploadStudyMaterialMutation, useGetSubjectsQuery } from '../../redux/api/teacherApi.js';
import { useGetMyRoomsQuery } from '../../redux/api/roomApi.js';
import toast from 'react-hot-toast';

const FILE_TYPES = ['PDF', 'DOC', 'IMAGE', 'PPT', 'VIDEO', 'OTHER'];

export const UploadMaterialModal = ({ onClose }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    fileType: 'PDF',
    accessType: 'public',
    roomId: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const { data: subjectsData } = useGetSubjectsQuery();
  const subjects = subjectsData?.data || [];

  const { data: roomsData } = useGetMyRoomsQuery();
  const myRooms = roomsData?.data || [];

  const [uploadMaterial, { isLoading }] = useUploadStudyMaterialMutation();

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (file) => {
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('video/')) {
        setForm((prev) => ({ ...prev, fileType: 'VIDEO' }));
      } else if (file.type.startsWith('image/')) {
        setForm((prev) => ({ ...prev, fileType: 'IMAGE' }));
      } else if (file.type === 'application/pdf') {
        setForm((prev) => ({ ...prev, fileType: 'PDF' }));
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return toast.error('Please select a file');
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.subjectId) return toast.error('Please select a subject');
    if (form.accessType === 'paid' && !form.roomId) {
      return toast.error('Please select a paid Room for this material');
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('subjectId', form.subjectId);
    formData.append('fileType', form.fileType);
    formData.append('accessType', form.accessType);
    if (form.accessType === 'paid' && form.roomId) {
      formData.append('room', form.roomId);
    }

    try {
      await uploadMaterial(formData).unwrap();
      toast.success('Study material uploaded! 📚');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Upload failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-fadeIn overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-500/10">
              <Upload className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Upload Study Material</h2>
              <p className="text-xs text-slate-400">Uploaded to Cloudinary — instant streaming & access for students</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* File Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
              dragOver
                ? 'border-green-500 bg-green-500/10'
                : selectedFile
                ? 'border-green-600 bg-green-500/5'
                : 'border-slate-700 hover:border-slate-500 bg-slate-800/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov,.mkv"
              onChange={(e) => handleFileChange(e.target.files[0])}
            />
            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-green-400" />
                <p className="text-sm font-bold text-slate-200">{selectedFile.name}</p>
                <p className="text-xs text-slate-400">{formatSize(selectedFile.size)}</p>
                <p className="text-[10px] text-green-400">Click to change file</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-slate-500" />
                <p className="text-sm font-semibold text-slate-300">Drop file here or click to browse</p>
                <p className="text-xs text-slate-500">PDF, DOC, PPTX, Images, Videos — max 250 MB</p>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Graph Theory Notes - Chapter 3"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-slate-500"
            />
          </div>

          {/* Subject + File Type row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                name="subjectId"
                value={form.subjectId}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select...</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                File Type
              </label>
              <select
                name="fileType"
                value={form.fileType}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {FILE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Access Control Options (Public vs Paid Room) */}
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
                    ? 'bg-green-600/20 border-green-500 text-green-300'
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
                    ? 'bg-accent-605/20 border-accent-500 text-accent-500/50'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Paid Room</span>
              </button>
            </div>

            {form.accessType === 'paid' && (
              <div className="pt-2 animate-in fade-in duration-150">
                <label className="block text-[11px] font-bold text-accent-500 mb-1">
                  Select Target Paid Room <span className="text-red-500">*</span>
                </label>
                {myRooms.length === 0 ? (
                  <p className="text-xs text-accent-500/50/80 bg-accent-500/10 p-2 rounded-lg border border-accent-500/20">
                    No paid rooms found. Create a paid room first under Teacher Dashboard or Profile.
                  </p>
                ) : (
                  <select
                    name="roomId"
                    value={form.roomId}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-accent-500/50 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
                  >
                    <option value="">Select Paid Room...</option>
                    {myRooms.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.title} (₹{r?.price ? (r.price / 100).toFixed(0) : '0'})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
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
              rows={2}
              placeholder="Brief description of this material..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-slate-500 resize-none"
            />
          </div>

          {/* Upload progress info */}
          {isLoading && (
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <p className="text-xs text-green-300">Uploading to Cloudinary...</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:flex-1 justify-center" disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:flex-1 justify-center bg-green-600 hover:bg-green-500" disabled={isLoading || !selectedFile}>
              {isLoading ? 'Uploading...' : '📤 Upload Material'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
