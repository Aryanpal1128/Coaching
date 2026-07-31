import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { TeacherProfile } from '../models/TeacherProfile.js';
import { ApiError } from '../utils/ApiError.js';
import { generateTokens, generateEmailVerificationToken, generatePasswordResetToken, verifyToken } from '../utils/token.js';
import { sendEmail } from './email.service.js';
import { ROLES } from '../constants/roles.js';

export const registerUser = async (userData) => {
  const { name, email, password, role } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'User with this email already exists');
  }

  const userRole = role && Object.values(ROLES).includes(role) ? role : ROLES.STUDENT;

  const user = await User.create({
    name,
    email,
    password,
    role: userRole
  });

  if (userRole === ROLES.STUDENT) {
    await StudentProfile.create({ user: user._id });
  } else if (userRole === ROLES.TEACHER) {
    await TeacherProfile.create({ user: user._id });
  }

  const verificationToken = generateEmailVerificationToken(user);
  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Verify Your Email - AI Learning Platform',
    html: `<p>Hello ${user.name},</p><p>Please click the link below to verify your account:</p><a href="${verifyUrl}">${verifyUrl}</a>`
  });

  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshToken = refreshToken;
  await user.save();

  return { user, accessToken, refreshToken, verificationToken };
};

export const verifyEmailToken = async (token) => {
  const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET || 'fallback_access_secret');
  if (decoded.type !== 'VERIFY_EMAIL') {
    throw new ApiError(400, 'Invalid email verification token');
  }

  const user = await User.findById(decoded._id);
  if (!user) throw new ApiError(404, 'User not found');

  user.isVerified = true;
  await user.save();
  return user;
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.isSuspended) {
    throw new ApiError(403, 'Your account is suspended.');
  }

  user.lastActiveAt = new Date();
  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshToken = refreshToken;
  await user.save();

  user.password = undefined;
  return { user, accessToken, refreshToken };
};

export const refreshAccessToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Refresh token required');
  }

  const decoded = verifyToken(
    incomingRefreshToken,
    process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret'
  );

  const user = await User.findById(decoded._id).select('+refreshToken');
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
  user.refreshToken = newRefreshToken;
  await user.save();

  return { accessToken, refreshToken: newRefreshToken };
};

export const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
  return true;
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'User not found');

  const resetToken = generatePasswordResetToken(user);
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html: `<p>Hello ${user.name},</p><p>Reset your password by clicking below:</p><a href="${resetUrl}">${resetUrl}</a>`
  });

  return resetToken;
};

export const resetPassword = async (token, newPassword) => {
  const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET || 'fallback_access_secret');
  if (decoded.type !== 'RESET_PASSWORD') {
    throw new ApiError(400, 'Invalid reset password token');
  }

  const user = await User.findById(decoded._id);
  if (!user) throw new ApiError(404, 'User not found');

  user.password = newPassword;
  await user.save();
  return true;
};

export const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  const isMatched = await user.comparePassword(oldPassword);
  if (!isMatched) {
    throw new ApiError(400, 'Incorrect old password');
  }

  user.password = newPassword;
  await user.save();
  return true;
};
