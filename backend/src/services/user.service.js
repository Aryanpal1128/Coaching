import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { TeacherProfile } from '../models/TeacherProfile.js';
import { ApiError } from '../utils/ApiError.js';

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('name avatar role level reputation badge savedQuestions createdAt');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  let profile = null;
  if (user.role === 'TEACHER' || user.role === 'ADMIN') {
    profile = await TeacherProfile.findOne({ user: userId }).populate('subjectsTaught', 'name');
  } else {
    profile = await StudentProfile.findOne({ user: userId }).populate('subjectsOfInterest', 'name');
  }

  // Safe fallback if profile is missing
  if (!profile) {
    profile = {
      bio: '',
      institution: 'AI Learning Platform',
      gradeOrYear: 'Level 1',
      solvedQuestionsCount: 0,
      askedQuestionsCount: 0,
      answersCount: 0
    };
  }

  return {
    user,
    profile
  };
};
