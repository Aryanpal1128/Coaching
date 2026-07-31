import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    gradeOrYear: {
      type: String,
      default: 'High School'
    },
    institution: {
      type: String,
      default: 'General Academy'
    },
    bio: {
      type: String,
      maxlength: 500,
      default: ''
    },
    subjectsOfInterest: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      }
    ],
    followingUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    followingTeachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    bookmarkedQuestions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      }
    ],
    followingQuestions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      }
    ],
    solvedQuestionsCount: {
      type: Number,
      default: 0
    },
    askedQuestionsCount: {
      type: Number,
      default: 0
    },
    answersCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
