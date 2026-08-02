import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Compound index for conversation lookup
messageSchema.index({ sender: 1, recipient: 1 });

export const Message = mongoose.model('Message', messageSchema);
