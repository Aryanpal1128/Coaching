import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
  {
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      required: true,
      index: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: [true, 'Reply text is required'],
      trim: true
    }
  },
  { timestamps: true }
);

export const Reply = mongoose.model('Reply', replySchema);
