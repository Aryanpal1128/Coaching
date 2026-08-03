import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as authService from '../services/auth.service.js';

// Cross-domain cookie options.
// sameSite: 'none' + secure: true are required when the frontend (Vercel)
// and backend (Render) are on different domains — otherwise browsers silently
// drop the httpOnly refreshToken cookie and all token refreshes fail.
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
};

export const register = asyncHandler(async (req, res) => {
  const { refreshToken, ...responseData } = await authService.registerUser(req.body);

  res.cookie('refreshToken', refreshToken, cookieOptions);

  return res.status(201).json(
    new ApiResponse(201, responseData, 'User registered successfully. Please verify your email.')
  );
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  const user = await authService.verifyEmailToken(token);
  return res.status(200).json(new ApiResponse(200, user, 'Email verified successfully'));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { refreshToken, ...responseData } = await authService.loginUser(email, password);

  res.cookie('refreshToken', refreshToken, cookieOptions);

  return res.status(200).json(new ApiResponse(200, responseData, 'Logged in successfully'));
});

export const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  const { refreshToken: newRefreshToken, ...responseData } = await authService.refreshAccessToken(incomingRefreshToken);

  res.cookie('refreshToken', newRefreshToken, cookieOptions);

  return res.status(200).json(new ApiResponse(200, responseData, 'Access token refreshed'));
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user._id);
  res.clearCookie('refreshToken', cookieOptions);
  return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const resetToken = await authService.forgotPassword(email);
  return res
    .status(200)
    .json(new ApiResponse(200, { resetToken }, 'Password reset instructions sent to email'));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  await authService.resetPassword(token, newPassword);
  return res.status(200).json(new ApiResponse(200, null, 'Password reset successful'));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  await authService.changePassword(req.user._id, oldPassword, newPassword);
  return res.status(200).json(new ApiResponse(200, null, 'Password changed successfully'));
});

export const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, 'Current user profile fetched'));
});
