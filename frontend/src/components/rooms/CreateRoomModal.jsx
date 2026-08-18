import React, { useState } from 'react';
import { X, Lock, DollarSign, Tag, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button.jsx';
import { useCreateRoomMutation } from '../../redux/api/roomApi.js';
import toast from 'react-hot-toast';

export const CreateRoomModal = ({ onClose }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '' // stored in INR in form input, converted to paise on submit
  });

  const [createRoom, { isLoading }] = useCreateRoomMutation();

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Room title is required');
    if (!form.price || isNaN(form.price) || Number(form.price) < 0) {
      return toast.error('Please enter a valid price in INR');
    }

    try {
      // Price in smallest currency unit (paise for INR: ₹499 -> 49900 paise)
      const priceInPaise = Math.round(Number(form.price) * 100);

      await createRoom({
        title: form.title.trim(),
        description: form.description.trim(),
        price: priceInPaise,
        currency: 'INR'
      }).unwrap();

      toast.success('Paid Room created successfully! 💎');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create room');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl animate-fadeIn overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-accent-500/10 text-accent-500">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Create Paid Room</h2>
              <p className="text-xs text-slate-400">Monetize your live classes & study materials</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Room Title */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Room Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Premium JEE Math Mastery Room"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder:text-slate-500"
            />
          </div>

          {/* Price (INR) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Price (₹ INR) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
              <input
                name="price"
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={handleChange}
                placeholder="499"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder:text-slate-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              One-time enrollment fee for students to access all content in this room.
            </p>
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
              placeholder="Describe what students get when they enroll (e.g. Exclusive video lectures, PDF notes, weekly live sessions)..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500 placeholder:text-slate-500 resize-none"
            />
          </div>

          {/* Feature Badge info */}
          <div className="p-3.5 rounded-2xl bg-accent-500/10 border border-accent-500/20 text-accent-500/50 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Once created, you can link any live class or study material to this room. Only enrolled students will get access!
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:flex-1 justify-center" disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:flex-1 justify-center bg-accent-605 hover:bg-accent-500 text-white font-bold" disabled={isLoading}>
              {isLoading ? 'Creating Room...' : '💎 Create Paid Room'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
