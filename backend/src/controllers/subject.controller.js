import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Subject } from '../models/Subject.js';

export const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find().sort({ name: 1 });
  return res.status(200).json(new ApiResponse(200, subjects, 'Subjects fetched'));
});
