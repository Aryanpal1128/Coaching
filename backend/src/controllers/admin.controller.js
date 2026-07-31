import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as adminService from '../services/admin.service.js';

export const toggleUserSuspension = asyncHandler(async (req, res) => {
  const { isSuspended } = req.body;
  const result = await adminService.toggleUserSuspension(req.params.userId, isSuspended);
  return res.status(200).json(new ApiResponse(200, result, 'User suspension status updated'));
});

export const deleteUser = asyncHandler(async (req, res) => {
  await adminService.deleteUserByAdmin(req.params.userId);
  return res.status(200).json(new ApiResponse(200, null, 'User deleted by admin'));
});

export const getAllReports = asyncHandler(async (req, res) => {
  const reports = await adminService.getAllReports(req.query.status);
  return res.status(200).json(new ApiResponse(200, reports, 'Reports fetched'));
});

export const resolveReport = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const report = await adminService.resolveReport(req.params.id, action);
  return res.status(200).json(new ApiResponse(200, report, 'Report resolved successfully'));
});

export const createSubject = asyncHandler(async (req, res) => {
  const { name, code, description } = req.body;
  const subject = await adminService.createSubject(name, code, description);
  return res.status(201).json(new ApiResponse(201, subject, 'Subject created successfully'));
});

export const createBadge = asyncHandler(async (req, res) => {
  const { name, description, icon, minReputation, category } = req.body;
  const badge = await adminService.createBadge(name, description, icon, minReputation, category);
  return res.status(201).json(new ApiResponse(201, badge, 'Badge created successfully'));
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await adminService.getPlatformAnalytics();
  return res.status(200).json(new ApiResponse(200, analytics, 'Platform analytics fetched'));
});
