import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    answer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Answer',
      required: true,
      index: true
    },
    voteType: {
      type: String,
      enum: ['UPVOTE', 'DOWNVOTE'],
      required: true
    }
  },
  { timestamps: true }
);

voteSchema.index({ user: 1, answer: 1 }, { unique: true });

export const Vote = mongoose.model('Vote', voteSchema);
