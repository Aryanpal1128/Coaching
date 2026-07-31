import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    liveClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LiveClass',
      required: true,
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ liveClass: 1, student: 1 }, { unique: true });

export const Attendance = mongoose.model('Attendance', attendanceSchema);
