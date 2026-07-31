import mongoose from 'mongoose';

const reputationHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    points: {
      type: Number,
      required: true
    },
    event: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  { timestamps: true }
);

export const ReputationHistory = mongoose.model('ReputationHistory', reputationHistorySchema);
