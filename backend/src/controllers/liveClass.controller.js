import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as liveClassService from '../services/liveClass.service.js';

export const getLiveClasses = asyncHandler(async (req, res) => {
  const { status, teacherId } = req.query;
  const classes = await liveClassService.getLiveClasses({ status, teacherId });
  return res.status(200).json(new ApiResponse(200, classes, 'Live classes fetched'));
});

export const getLiveClass = asyncHandler(async (req, res) => {
  const liveClass = await liveClassService.getLiveClass(req.params.id, req.user);
  return res.status(200).json(new ApiResponse(200, liveClass, 'Live class fetched'));
});

export const scheduleLiveClass = asyncHandler(async (req, res) => {
  const liveClass = await liveClassService.scheduleLiveClass(req.user._id, req.body);
  return res.status(201).json(new ApiResponse(201, liveClass, 'Live class scheduled successfully'));
});

export const startLiveClass = asyncHandler(async (req, res) => {
  const liveClass = await liveClassService.startLiveClass(req.user._id, req.params.id);
  return res.status(200).json(new ApiResponse(200, liveClass, 'Live class started! Notifications sent.'));
});

export const endLiveClass = asyncHandler(async (req, res) => {
  const liveClass = await liveClassService.endLiveClass(req.user._id, req.params.id);
  return res.status(200).json(new ApiResponse(200, liveClass, 'Live class ended'));
});

export const cancelLiveClass = asyncHandler(async (req, res) => {
  const liveClass = await liveClassService.cancelLiveClass(req.user._id, req.params.id);
  return res.status(200).json(new ApiResponse(200, liveClass, 'Live class cancelled'));
});

export const uploadRecording = asyncHandler(async (req, res) => {
  const { recordingUrl } = req.body;
  const liveClass = await liveClassService.uploadRecording(req.user._id, req.params.id, recordingUrl);
  return res.status(200).json(new ApiResponse(200, liveClass, 'Class recording uploaded'));
});

export const recordAttendance = asyncHandler(async (req, res) => {
  const attendance = await liveClassService.recordAttendance(req.user._id, req.params.id, req.user);
  return res.status(200).json(new ApiResponse(200, attendance, 'Attendance recorded'));
});

export const startInstantLiveClass = asyncHandler(async (req, res) => {
  const liveClass = await liveClassService.startInstantLiveClass(req.user._id);
  return res.status(201).json(new ApiResponse(201, liveClass, 'Instant live class started!'));
});
