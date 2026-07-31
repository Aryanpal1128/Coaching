import mongoose from 'mongoose';

const teacherProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    title: {
      type: String,
      default: 'Instructor'
    },
    bio: {
      type: String,
      maxlength: 1000,
      default: ''
    },
    qualification: {
      type: String,
      default: 'M.Sc / B.Tech'
    },
    experienceYears: {
      type: Number,
      default: 1
    },
    subjectsTaught: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      }
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    isVerifiedTeacher: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const TeacherProfile = mongoose.model('TeacherProfile', teacherProfileSchema);
