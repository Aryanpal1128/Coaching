import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: [
        'QUESTION_ANSWERED',
        'ANSWER_UPVOTED',
        'TEACHER_LIVE_CLASS',
        'TEACHER_NOTES',
        'ASSIGNMENT_POSTED',
        'BADGE_EARNED',
        'AI_EVALUATION_COMPLETED'
      ],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    link: {
      type: String
    }
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);
