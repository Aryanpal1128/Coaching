import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as followService from '../services/follow.service.js';

export const followUser = asyncHandler(async (req, res) => {
  const result = await followService.followUser(req.user._id, req.params.userId);
  return res.status(200).json(new ApiResponse(200, result, 'Follow request processed'));
});

export const unfollowUser = asyncHandler(async (req, res) => {
  const result = await followService.unfollowUser(req.user._id, req.params.userId);
  return res.status(200).json(new ApiResponse(200, result, 'Unfollowed user'));
});

export const getFollowers = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await followService.getFollowers(req.params.userId, { page, limit });
  return res.status(200).json(new ApiResponse(200, result, 'Followers fetched'));
});

export const getFollowing = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await followService.getFollowing(req.params.userId, { page, limit });
  return res.status(200).json(new ApiResponse(200, result, 'Following fetched'));
});

export const getFollowCounts = asyncHandler(async (req, res) => {
  const counts = await followService.getFollowCounts(req.params.userId);
  const isFollowing = await followService.isFollowing(req.user?._id, req.params.userId);
  return res.status(200).json(new ApiResponse(200, { ...counts, isFollowing }, 'Follow counts & status fetched'));
});
