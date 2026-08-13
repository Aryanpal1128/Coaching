import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
      index: true
    },
    razorpayPaymentId: {
      type: String,
      default: ''
    },
    razorpayOrderId: {
      type: String,
      default: ''
    },
    paidAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, room: 1, status: 1 });

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
