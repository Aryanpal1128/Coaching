import mongoose from 'mongoose';

const liveClassSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Live class title is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'LIVE', 'CANCELLED', 'ENDED'],
      default: 'SCHEDULED',
      index: true
    },
    meetingLink: {
      type: String,
      required: true
    },
    recordingUrl: {
      type: String,
      default: ''
    },
    attendeesCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export const LiveClass = mongoose.model('LiveClass', liveClassSchema);
