import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Room title is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      required: [true, 'Room price is required'],
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const Room = mongoose.model('Room', roomSchema);
