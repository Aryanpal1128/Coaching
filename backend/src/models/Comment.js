import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    answer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Answer',
      required: true,
      index: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true
    }
  },
  { timestamps: true }
);

commentSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  await mongoose.model('Reply').deleteMany({ comment: this._id });
  next();
});

export const Comment = mongoose.model('Comment', commentSchema);
