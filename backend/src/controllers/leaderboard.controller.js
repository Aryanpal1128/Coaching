import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as leaderboardService from '../services/leaderboard.service.js';

export const getOverallLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await leaderboardService.getOverallLeaderboard(req.query.limit);
  return res.status(200).json(new ApiResponse(200, leaderboard, 'Overall leaderboard fetched'));
});

export const getWeeklyLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await leaderboardService.getPeriodicLeaderboard(7, req.query.limit);
  return res.status(200).json(new ApiResponse(200, leaderboard, 'Weekly leaderboard fetched'));
});

export const getMonthlyLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await leaderboardService.getPeriodicLeaderboard(30, req.query.limit);
  return res.status(200).json(new ApiResponse(200, leaderboard, 'Monthly leaderboard fetched'));
});

export const getSubjectLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await leaderboardService.getSubjectWiseLeaderboard(
    req.params.subjectId,
    req.query.limit
  );
  return res.status(200).json(new ApiResponse(200, leaderboard, 'Subject leaderboard fetched'));
});
