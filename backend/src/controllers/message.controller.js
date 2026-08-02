import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as messageService from '../services/message.service.js';

// GET /messages/conversations — list of conversations
export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await messageService.getConversations(req.user._id);
  return res.status(200).json(new ApiResponse(200, conversations, 'Conversations fetched'));
});

// GET /messages/:partnerId — chat history with a user
export const getMessages = asyncHandler(async (req, res) => {
  const messages = await messageService.getMessages(req.user._id, req.params.partnerId);
  return res.status(200).json(new ApiResponse(200, messages, 'Messages fetched'));
});

// POST /messages/:recipientId — send a message (HTTP fallback)
export const sendMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) {
    return res.status(400).json(new ApiResponse(400, null, 'Message text required'));
  }
  const message = await messageService.saveMessage(req.user._id, req.params.recipientId, text);
  return res.status(201).json(new ApiResponse(201, message, 'Message sent'));
});

// GET /messages/users — list all users to start a new conversation
export const getUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const users = await messageService.getUsers(req.user._id, search);
  return res.status(200).json(new ApiResponse(200, users, 'Users fetched'));
});
