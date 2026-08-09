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
