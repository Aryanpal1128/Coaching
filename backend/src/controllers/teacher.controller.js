import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as teacherService from '../services/teacher.service.js';

export const uploadStudyMaterial = asyncHandler(async (req, res) => {
  const material = await teacherService.uploadStudyMaterial(req.user._id, req.body);
  return res.status(201).json(new ApiResponse(201, material, 'Study material uploaded successfully'));
});

export const createNotes = asyncHandler(async (req, res) => {
  const notes = await teacherService.createNotes(req.user._id, req.body);
  return res.status(201).json(new ApiResponse(201, notes, 'Notes created and notified to followers'));
});

export const createAssignment = asyncHandler(async (req, res) => {
  const assignment = await teacherService.createAssignment(req.user._id, req.body);
  return res.status(201).json(new ApiResponse(201, assignment, 'Assignment created successfully'));
});

export const followTeacher = asyncHandler(async (req, res) => {
  const result = await teacherService.followTeacher(req.user._id, req.params.teacherId);
  return res.status(200).json(new ApiResponse(200, result, 'Teacher follow status updated'));
});
