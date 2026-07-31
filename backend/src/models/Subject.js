import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    code: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

export const Subject = mongoose.model('Subject', subjectSchema);
