import mongoose from 'mongoose';

const callSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    callee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['audio', 'video'],
      required: true,
      default: 'video'
    },
    status: {
      type: String,
      enum: ['completed', 'missed', 'rejected', 'failed'],
      required: true,
      default: 'completed'
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    endedAt: {
      type: Date
    },
    duration: {
      type: Number, // Duration in seconds
      default: 0
    }
  },
  { timestamps: true }
);

export const Call = mongoose.model('Call', callSchema);
