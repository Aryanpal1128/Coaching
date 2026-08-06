import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { TeacherProfile } from '../models/TeacherProfile.js';
import { ApiError } from '../utils/ApiError.js';
import { generateTokens, generateEmailVerificationToken, generatePasswordResetToken, verifyToken } from '../utils/token.js';
import { sendEmail } from './email.service.js';
import { ROLES } from '../constants/roles.js';
import logger from '../config/logger.js';
import { OAuth2Client } from 'google-auth-library';

export const registerUser = async (userData) => {
  const { name, email, password, role } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'User with this email already exists');
  }

  const userRole = role && Object.values(ROLES).includes(role) ? role : ROLES.STUDENT;
  logger.info("Creating user...");


  const user = await User.create({
    name,
    email,
    password,
    role: userRole
  });

  if (userRole === ROLES.STUDENT) {
    await StudentProfile.create({ user: user._id });
    logger.info("Student profile created");
  } else if (userRole === ROLES.TEACHER) {
    await TeacherProfile.create({ user: user._id });
  }

  const verificationToken = generateEmailVerificationToken(user);
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  logger.info("Sending verification email...");
  await sendEmail({
    to: user.email,
    subject: 'Verify Your Email - AI Learning Platform',
    html: `<p>Hello ${user.name},</p><p>Please click the link below to verify your account:</p><a href="${verifyUrl}">${verifyUrl}</a>`
  });
  logger.info("Verification email step completed");

  return { user, verificationToken };
};

export const verifyEmailToken = async (token) => {
  const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);
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

  if (!user.isVerified) {
    throw new ApiError(403, 'Your email address is not verified. Please verify your email first.');
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

  const decoded = verifyToken(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);

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
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html: `<p>Hello ${user.name},</p><p>Reset your password by clicking below:</p><a href="${resetUrl}">${resetUrl}</a>`
  });

  return resetToken;
};

export const resetPassword = async (token, newPassword) => {
  const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);
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

export const googleAuth = async (idToken, role) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    throw new ApiError(500, 'Google Client ID is not configured on the server.');
  }

  const client = new OAuth2Client(googleClientId);
  let payload;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleClientId,
    });
    payload = ticket.getPayload();
  } catch (error) {
    throw new ApiError(400, 'Invalid Google ID token: ' + error.message);
  }

  const { email, name, picture } = payload;

  if (!email) {
    throw new ApiError(400, 'Google account is missing email address');
  }

  // Find or create user
  let user = await User.findOne({ email });

  if (!user) {
    const userRole = role && Object.values(ROLES).includes(role) ? role : ROLES.STUDENT;
    // Create new Google Auth user, already verified by Google
    user = await User.create({
      name,
      email,
      password: Math.random().toString(36).slice(-10), // random safe password
      role: userRole,
      avatar: picture || 'https://res.cloudinary.com/demo/image/upload/v1571218039/sample.jpg',
      isVerified: true
    });

    if (userRole === ROLES.STUDENT) {
      await StudentProfile.create({ user: user._id });
    } else if (userRole === ROLES.TEACHER) {
      await TeacherProfile.create({ user: user._id });
    }
  } else {
    // If user existed but wasn't verified, mark them verified since they proved access via Google Auth
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }
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