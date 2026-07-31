import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
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
    attachments: [
      {
        name: String,
        url: String
      }
    ],
    dueDate: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

export const Assignment = mongoose.model('Assignment', assignmentSchema);
