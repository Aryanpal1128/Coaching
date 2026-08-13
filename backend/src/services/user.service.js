import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { TeacherProfile } from '../models/TeacherProfile.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../middlewares/upload.middleware.js';

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('name username avatar role level reputation badge isOnboarded savedQuestions createdAt');
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

export const updateAvatar = async (userId, file) => {
  if (!file) {
    throw new ApiError(400, 'No avatar image file provided');
  }

  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    throw new ApiError(400, 'Only image files (JPEG, PNG, WEBP, GIF) are allowed for avatar');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.avatarPublicId) {
    try {
      await deleteFromCloudinary(user.avatarPublicId, 'image');
    } catch (err) {
      console.warn('Failed to delete existing Cloudinary avatar:', err);
    }
  }

  const cloudResult = await uploadToCloudinary(file.buffer, 'avatars', 'image');

  user.avatar = cloudResult.secure_url;
  user.avatarPublicId = cloudResult.public_id;
  await user.save();

  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    avatarPublicId: user.avatarPublicId,
    role: user.role,
    level: user.level,
    reputation: user.reputation,
    badge: user.badge,
    isOnboarded: user.isOnboarded
  };
};

export const checkUsernameAvailable = async (value, currentUserId = null) => {
  if (!value || typeof value !== 'string') {
    return { available: false, message: 'Username is required' };
  }

  const clean = value.trim().toLowerCase();
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

  if (!usernameRegex.test(clean)) {
    return {
      available: false,
      message: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores'
    };
  }

  const query = { username: clean };
  if (currentUserId) {
    query._id = { $ne: currentUserId };
  }

  const existing = await User.findOne(query);
  if (existing) {
    return { available: false, message: 'Username is already taken' };
  }

  return { available: true, message: 'Username is available' };
};

export const onboardUser = async (userId, data, file) => {
  const {
    username,
    bio,
    stream,
    subjectsOfInterest,
    institution,
    gradeOrYear,
    qualification,
    experienceYears,
    subjectsTaught
  } = data;

  if (!username || typeof username !== 'string') {
    throw new ApiError(400, 'Username is required');
  }

  const cleanUsername = username.trim().toLowerCase();
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

  if (!usernameRegex.test(cleanUsername)) {
    throw new ApiError(400, 'Username must be 3-20 characters long and contain only letters, numbers, and underscores');
  }

  const existing = await User.findOne({ username: cleanUsername, _id: { $ne: userId } });
  if (existing) {
    throw new ApiError(400, 'Username is already taken');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.username = cleanUsername;
  user.isOnboarded = true;

  if (file) {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new ApiError(400, 'Only image files (JPEG, PNG, WEBP, GIF) are allowed for avatar');
    }

    if (user.avatarPublicId) {
      try {
        await deleteFromCloudinary(user.avatarPublicId, 'image');
      } catch (err) {
        console.warn('Failed to delete existing Cloudinary avatar:', err);
      }
    }

    const cloudResult = await uploadToCloudinary(file.buffer, 'avatars', 'image');
    user.avatar = cloudResult.secure_url;
    user.avatarPublicId = cloudResult.public_id;
  }

  await user.save();

  if (user.role === 'TEACHER' || user.role === 'ADMIN') {
    let profile = await TeacherProfile.findOne({ user: userId });
    if (!profile) {
      profile = new TeacherProfile({ user: userId });
    }
    if (bio !== undefined && bio !== null && bio !== '') profile.bio = bio;
    if (qualification !== undefined && qualification !== null && qualification !== '') profile.qualification = qualification;
    if (experienceYears !== undefined && experienceYears !== null && experienceYears !== '') {
      profile.experienceYears = Number(experienceYears);
    }
    if (subjectsTaught !== undefined && subjectsTaught !== null) {
      try {
        const parsedSubjects = typeof subjectsTaught === 'string' ? JSON.parse(subjectsTaught) : subjectsTaught;
        if (Array.isArray(parsedSubjects)) profile.subjectsTaught = parsedSubjects;
      } catch (e) {
        // ignore parse error if plain string or format issue
      }
    }
    await profile.save();
  } else {
    let profile = await StudentProfile.findOne({ user: userId });
    if (!profile) {
      profile = new StudentProfile({ user: userId });
    }
    if (bio !== undefined && bio !== null && bio !== '') profile.bio = bio;
    if (stream !== undefined && stream !== null && stream !== '') profile.stream = stream;
    if (institution !== undefined && institution !== null && institution !== '') profile.institution = institution;
    if (gradeOrYear !== undefined && gradeOrYear !== null && gradeOrYear !== '') profile.gradeOrYear = gradeOrYear;
    if (subjectsOfInterest !== undefined && subjectsOfInterest !== null) {
      try {
        const parsedSubjects = typeof subjectsOfInterest === 'string' ? JSON.parse(subjectsOfInterest) : subjectsOfInterest;
        if (Array.isArray(parsedSubjects)) profile.subjectsOfInterest = parsedSubjects;
      } catch (e) {
        // ignore parse error if format issue
      }
    }
    await profile.save();
  }

  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    avatarPublicId: user.avatarPublicId,
    role: user.role,
    level: user.level,
    reputation: user.reputation,
    badge: user.badge,
    isOnboarded: user.isOnboarded
  };
};

export const updateUserProfile = async (userId, data, file) => {
  const {
    username,
    bio,
    stream,
    subjectsOfInterest,
    institution,
    gradeOrYear,
    qualification,
    experienceYears,
    subjectsTaught
  } = data;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (username && typeof username === 'string' && username.trim().toLowerCase() !== user.username) {
    const cleanUsername = username.trim().toLowerCase();
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

    if (!usernameRegex.test(cleanUsername)) {
      throw new ApiError(400, 'Username must be 3-20 characters long and contain only letters, numbers, and underscores');
    }

    const existing = await User.findOne({ username: cleanUsername, _id: { $ne: userId } });
    if (existing) {
      throw new ApiError(400, 'Username is already taken');
    }

    user.username = cleanUsername;
  }

  if (file) {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new ApiError(400, 'Only image files (JPEG, PNG, WEBP, GIF) are allowed for avatar');
    }

    if (user.avatarPublicId) {
      try {
        await deleteFromCloudinary(user.avatarPublicId, 'image');
      } catch (err) {
        console.warn('Failed to delete existing Cloudinary avatar:', err);
      }
    }

    const cloudResult = await uploadToCloudinary(file.buffer, 'avatars', 'image');
    user.avatar = cloudResult.secure_url;
    user.avatarPublicId = cloudResult.public_id;
  }

  await user.save();

  let profile = null;
  if (user.role === 'TEACHER' || user.role === 'ADMIN') {
    profile = await TeacherProfile.findOne({ user: userId });
    if (!profile) {
      profile = new TeacherProfile({ user: userId });
    }
    if (bio !== undefined && bio !== null) profile.bio = bio;
    if (qualification !== undefined && qualification !== null) profile.qualification = qualification;
    if (experienceYears !== undefined && experienceYears !== null) {
      profile.experienceYears = Number(experienceYears);
    }
    if (subjectsTaught !== undefined && subjectsTaught !== null) {
      try {
        const parsedSubjects = typeof subjectsTaught === 'string' ? JSON.parse(subjectsTaught) : subjectsTaught;
        if (Array.isArray(parsedSubjects)) profile.subjectsTaught = parsedSubjects;
      } catch (e) {
        // ignore format error
      }
    }
    await profile.save();
  } else {
    profile = await StudentProfile.findOne({ user: userId });
    if (!profile) {
      profile = new StudentProfile({ user: userId });
    }
    if (bio !== undefined && bio !== null) profile.bio = bio;
    if (stream !== undefined && stream !== null) profile.stream = stream;
    if (institution !== undefined && institution !== null) profile.institution = institution;
    if (gradeOrYear !== undefined && gradeOrYear !== null) profile.gradeOrYear = gradeOrYear;
    if (subjectsOfInterest !== undefined && subjectsOfInterest !== null) {
      try {
        const parsedSubjects = typeof subjectsOfInterest === 'string' ? JSON.parse(subjectsOfInterest) : subjectsOfInterest;
        if (Array.isArray(parsedSubjects)) profile.subjectsOfInterest = parsedSubjects;
      } catch (e) {
        // ignore format error
      }
    }
    await profile.save();
  }

  return {
    user: {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      avatarPublicId: user.avatarPublicId,
      role: user.role,
      level: user.level,
      reputation: user.reputation,
      badge: user.badge,
      isOnboarded: user.isOnboarded
    },
    profile
  };
};

