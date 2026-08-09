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
      trim: true,
      default: ''
    },
    attachments: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
        type: { type: String, enum: ['image', 'video', 'document', 'audio'], required: true },
        fileName: { type: String },
        fileSize: { type: Number }
      }
    ],
    read: {
      type: Boolean,
      default: false
    },
    parentMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        emoji: {
          type: String,
          required: true
        }
      }
    ]
  },
  { timestamps: true }
);

// Compound index for conversation lookup
messageSchema.index({ sender: 1, recipient: 1 });

export const Message = mongoose.model('Message', messageSchema);
