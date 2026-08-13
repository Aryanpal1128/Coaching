import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as userService from '../services/user.service.js';

export const getUserProfile = asyncHandler(async (req, res) => {
  const data = await userService.getUserProfile(req.params.userId);
  return res.status(200).json(new ApiResponse(200, data, 'User profile fetched successfully'));
});

export const updateUsername = asyncHandler(async (req, res) => {
  const { username } = req.body;
  const updatedUser = await userService.updateUsername(req.user._id, username);
  return res.status(200).json(new ApiResponse(200, updatedUser, 'Username updated successfully'));
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateAvatar(req.user._id, req.file);
  return res.status(200).json(new ApiResponse(200, updatedUser, 'Avatar updated successfully'));
});

export const checkUsernameAvailability = asyncHandler(async (req, res) => {
  const { value } = req.query;
  const currentUserId = req.user ? req.user._id : null;
  const result = await userService.checkUsernameAvailable(value, currentUserId);
  return res.status(200).json(new ApiResponse(200, result, 'Username availability status'));
});

export const onboardUser = asyncHandler(async (req, res) => {
  const updatedUser = await userService.onboardUser(req.user._id, req.body, req.file);
  return res.status(200).json(new ApiResponse(200, updatedUser, 'Onboarding completed successfully'));
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const result = await userService.updateUserProfile(req.user._id, req.body, req.file);
  return res.status(200).json(new ApiResponse(200, result, 'Profile updated successfully'));
});
