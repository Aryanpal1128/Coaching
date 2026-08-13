import React from 'react';
import { Lock, X, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../common/Button.jsx';
import { useCreateRoomOrderMutation, useVerifyRoomPaymentMutation } from '../../redux/api/roomApi.js';
import { handleRazorpayPayment } from '../../utils/razorpay.js';
import toast from 'react-hot-toast';

export const LockedContentModal = ({ item, user, onClose, onSuccess }) => {
  const room = item?.room;
  const teacher = item?.teacher || room?.teacher;
  const priceInINR = room?.price ? (room.price / 100).toFixed(0) : '0';

  const [createOrder, { isLoading: isOrdering }] = useCreateRoomOrderMutation();
  const [verifyPayment, { isLoading: isVerifying }] = useVerifyRoomPaymentMutation();

  const handleEnroll = async () => {
    if (!room?._id) return toast.error('Room information unavailable');
    try {
      const orderResponse = await createOrder(room._id).unwrap();
      await handleRazorpayPayment({
        orderResponse: orderResponse.data,
        user,
        verifyPaymentMutation: verifyPayment,
        onSuccess: () => {
          if (onSuccess) onSuccess();
          onClose();
        }
      });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to initialize payment');
    }
  };

  const isLoading = isOrdering || isVerifying;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-center p-6 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10 animate-bounce">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border border-amber-500/30">
            Paid Content Locked
          </span>
          <h3 className="text-xl font-black text-white mt-3 leading-snug">
            {item?.title || 'Exclusive Offering'}
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            This content is part of <strong className="text-slate-200">{teacher?.name || 'Instructor'}</strong>'s paid room: <strong className="text-amber-400">{room?.title || 'Premium Room'}</strong>.
          </p>
        </div>

        {/* Benefits list */}
        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-800 text-left space-y-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Lifetime access to all lectures & notes in this room</span>
          </div>
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0" />
            <span>Secure 100% verified payment via Razorpay</span>
          </div>
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Instant unlock right after payment</span>
          </div>
        </div>

        {/* Price & Action button */}
        <div className="pt-2">
          <Button
            onClick={handleEnroll}
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-extrabold text-sm shadow-xl shadow-amber-500/20 justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {isLoading ? 'Preparing Razorpay Checkout...' : `Enroll in Room — ₹${priceInINR}`}
          </Button>
          <p className="text-[10px] text-slate-500 mt-2">Instant access guaranteed upon successful payment</p>
        </div>
      </div>
    </div>
  );
};
