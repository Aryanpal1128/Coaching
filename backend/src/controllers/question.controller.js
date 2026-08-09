import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as questionService from '../services/question.service.js';

export const createQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.createQuestion(req.user._id, req.body);
  return res.status(201).json(new ApiResponse(201, question, 'Question asked successfully'));
});

export const getQuestionById = asyncHandler(async (req, res) => {
  const question = await questionService.getQuestionById(req.params.id);
  return res.status(200).json(new ApiResponse(200, question, 'Question details fetched'));
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.updateQuestion(
    req.params.id,
    req.user._id,
    req.body
  );
  return res.status(200).json(new ApiResponse(200, question, 'Question updated successfully'));
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  await questionService.deleteQuestion(req.params.id, req.user._id, req.user.role);
  return res.status(200).json(new ApiResponse(200, null, 'Question deleted successfully'));
});

export const searchQuestions = asyncHandler(async (req, res) => {
  const { page, limit, ...filters } = req.query;
  const result = await questionService.searchQuestions(filters, { page, limit });
  return res.status(200).json(new ApiResponse(200, result, 'Questions search results fetched'));
});

export const followQuestion = asyncHandler(async (req, res) => {
  const result = await questionService.followQuestion(req.params.id, req.user._id);
  return res.status(200).json(new ApiResponse(200, result, 'Question follow status updated'));
});

export const bookmarkQuestion = asyncHandler(async (req, res) => {
  const result = await questionService.bookmarkQuestion(req.params.id, req.user._id);
  return res.status(200).json(new ApiResponse(200, result, 'Question bookmark status updated'));
});

export const getSavedQuestions = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await questionService.getSavedQuestions(req.user._id, { page, limit });
  return res.status(200).json(new ApiResponse(200, result, 'Saved questions fetched'));
});

import { evaluateQuestionWithAI } from '../services/aiEvaluation.service.js';

export const suggestQuestionImprovements = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const suggestions = await evaluateQuestionWithAI(title || '', description || '');
  return res.status(200).json(new ApiResponse(200, suggestions, 'Question suggestions generated'));
});
