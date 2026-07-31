import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    answerText: {
      type: String,
      required: [true, 'Answer text is required']
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
    upvotesCount: {
      type: Number,
      default: 0
    },
    downvotesCount: {
      type: Number,
      default: 0
    },
    upvotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    downvotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    isAccepted: {
      type: Boolean,
      default: false
    },
    isTeacherEndorsed: {
      type: Boolean,
      default: false
    },
    endorsedByTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    aiAccuracyScore: {
      type: Number,
      default: 0
    },
    aiEvaluation: {
      accuracyScore: { type: Number, default: 0 },
      conceptCoverage: { type: String, default: '' },
      missingPoints: [{ type: String }],
      grammarScore: { type: Number, default: 0 },
      overallFeedback: { type: String, default: '' },
      confidenceScore: { type: Number, default: 0 },
      shortSummary: { type: String, default: '' },
      evaluatedAt: { type: Date }
    },
    timeTakenSeconds: {
      type: Number,
      default: 60
    },
    finalRankingScore: {
      type: Number,
      default: 0,
      index: true
    },
    reportsCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

answerSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  await mongoose.model('Comment').deleteMany({ answer: this._id });
  await mongoose.model('Question').findByIdAndUpdate(this.question, { $inc: { answersCount: -1 } });
  next();
});

export const Answer = mongoose.model('Answer', answerSchema);
