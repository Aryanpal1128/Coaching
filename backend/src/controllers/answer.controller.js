import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as answerService from '../services/answer.service.js';

export const submitAnswer = asyncHandler(async (req, res) => {
  const { questionId, answerText, images, attachments, timeTakenSeconds } = req.body;
  const answer = await answerService.submitAnswer(
    req.user._id,
    questionId,
    answerText,
    images,
    attachments,
    timeTakenSeconds
  );
  return res.status(201).json(new ApiResponse(201, answer, 'Answer submitted and AI evaluated successfully'));
});

export const getAnswersForQuestion = asyncHandler(async (req, res) => {
  const answers = await answerService.getAnswersForQuestion(req.params.questionId);
  return res.status(200).json(new ApiResponse(200, answers, 'Answers fetched in ranked order'));
});

export const voteAnswer = asyncHandler(async (req, res) => {
  const { voteType } = req.body;
  const result = await answerService.voteAnswer(req.user._id, req.params.id, voteType);
  return res.status(200).json(new ApiResponse(200, result, 'Vote recorded successfully'));
});

export const acceptAnswer = asyncHandler(async (req, res) => {
  const answer = await answerService.acceptAnswer(req.user._id, req.params.id);
  return res.status(200).json(new ApiResponse(200, answer, 'Answer marked as accepted solution'));
});

export const endorseAnswer = asyncHandler(async (req, res) => {
  const answer = await answerService.endorseAnswer(req.user._id, req.params.id);
  return res.status(200).json(new ApiResponse(200, answer, 'Answer endorsed by teacher'));
});

export const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const comment = await answerService.addComment(req.user._id, req.params.id, text);
  return res.status(201).json(new ApiResponse(201, comment, 'Comment added to answer'));
});

export const addReply = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const reply = await answerService.addReply(req.user._id, req.params.commentId, text);
  return res.status(201).json(new ApiResponse(201, reply, 'Reply added to comment'));
});
