import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      default: '🏆'
    },
    minReputation: {
      type: Number,
      default: 0
    },
    category: {
      type: String,
      enum: ['ACHIEVEMENT', 'REPUTATION', 'SPECIAL'],
      default: 'ACHIEVEMENT'
    }
  },
  { timestamps: true }
);

export const Badge = mongoose.model('Badge', badgeSchema);
