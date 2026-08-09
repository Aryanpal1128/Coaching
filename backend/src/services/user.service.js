import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { TeacherProfile } from '../models/TeacherProfile.js';
import { ApiError } from '../utils/ApiError.js';

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('name username avatar role level reputation badge savedQuestions createdAt');
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

export const updateUsername = async (userId, newUsername) => {
  if (!newUsername || typeof newUsername !== 'string') {
    throw new ApiError(400, 'Username is required');
  }

  const clean = newUsername.trim().toLowerCase();
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

  if (!usernameRegex.test(clean)) {
    throw new ApiError(400, 'Username must be 3-20 characters long and contain only letters, numbers, and underscores');
  }

  const existing = await User.findOne({ username: clean, _id: { $ne: userId } });
  if (existing) {
    throw new ApiError(400, 'Username is already taken');
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { username: clean },
    { new: true, runValidators: true }
  ).select('name username avatar role email level reputation badge');

  return updatedUser;
};
