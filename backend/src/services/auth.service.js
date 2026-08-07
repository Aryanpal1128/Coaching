import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { TeacherProfile } from '../models/TeacherProfile.js';
import { ApiError } from '../utils/ApiError.js';
import { generateTokens, generatePendingOTPToken, generatePasswordResetToken, verifyToken } from '../utils/token.js';
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

  // Generate 6-digit OTP code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Generate pending registration token with OTP
  const pendingToken = generatePendingOTPToken({
    name,
    email,
    password,
    role: userRole
  }, otp);

  logger.info(`Sending OTP verification email to ${email}...`);
  await sendEmail({
    to: email,
    subject: 'Verify Your Email - OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #4f46e5; text-align: center; margin-bottom: 20px;">Email Verification Code</h2>
        <p style="font-size: 14px; color: #334155; line-height: 1.5;">Hello ${name},</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.5;">Thank you for registering. Please enter the following 6-digit verification code to complete your registration:</p>
        <div style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 30px 0; color: #4f46e5; background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px dashed #cbd5e1;">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #64748b; text-align: center;">This code is valid for 15 minutes. Do not share this code with anyone.</p>
      </div>
    `
  });
  logger.info("Verification OTP email sent");

  return { pendingToken, email };
};

export const verifyOTPToken = async (pendingToken, submittedOtp) => {
  const decoded = verifyToken(pendingToken, process.env.JWT_ACCESS_SECRET);
  if (decoded.type !== 'PENDING_OTP') {
    throw new ApiError(400, 'Invalid or expired verification session.');
  }

  if (decoded.otp !== submittedOtp) {
    throw new ApiError(400, 'Incorrect verification code. Please check your email and try again.');
  }

  const { name, email, password, role } = decoded;

  // Check if user already exists
  let user = await User.findOne({ email });
  if (user) {
    throw new ApiError(400, 'User with this email already exists');
  }

  // Create user in DB now that email is verified
  user = await User.create({
    name,
    email,
    password, // will be hashed by mongoose pre-save hook
    role: role || 'STUDENT',
    isVerified: true
  });

  if (role === 'TEACHER') {
    await TeacherProfile.create({ user: user._id });
  } else {
    await StudentProfile.create({ user: user._id });
  }

  // Auto-login: generate JWT access & refresh tokens
  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshToken = refreshToken;
  await user.save();

  user.password = undefined;
  return { user, accessToken, refreshToken };
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