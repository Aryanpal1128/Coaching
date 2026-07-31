import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Question title is required'],
      trim: true,
      index: 'text'
    },
    description: {
      type: String,
      required: [true, 'Question description is required'],
      index: 'text'
    },
    images: [
      {
        type: String
      }
    ],
    attachments: [
      {
        name: String,
        url: String,
        fileType: String
      }
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        index: true
      }
    ],
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      index: true
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
      index: true
    },
    askedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    viewsCount: {
      type: Number,
      default: 0,
      index: true
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    isSolved: {
      type: Boolean,
      default: false,
      index: true
    },
    acceptedAnswer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Answer'
    },
    answersCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['OPEN', 'SOLVED', 'CLOSED'],
      default: 'OPEN'
    }
  },
  { timestamps: true }
);

questionSchema.index({ title: 'text', description: 'text' });

questionSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  await mongoose.model('Answer').deleteMany({ question: this._id });
  await mongoose.model('StudentProfile').updateMany(
    { $or: [{ followingQuestions: this._id }, { bookmarkedQuestions: this._id }] },
    { $pull: { followingQuestions: this._id, bookmarkedQuestions: this._id } }
  );
  next();
});

export const Question = mongoose.model('Question', questionSchema);
