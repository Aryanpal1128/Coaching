import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    usageCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export const Tag = mongoose.model('Tag', tagSchema);
