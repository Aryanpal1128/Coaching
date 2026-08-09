import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as messageService from '../services/message.service.js';
import { getIO } from '../sockets/socketManager.js';
import logger from '../config/logger.js';

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

import { uploadToCloudinary, getResourceType } from '../middlewares/upload.middleware.js';
import { ApiError } from '../utils/ApiError.js';

// POST /messages/:recipientId — send a message (HTTP fallback)
export const sendMessage = asyncHandler(async (req, res) => {
  const { text, parentMessageId } = req.body;
  if (!text?.trim()) {
    return res.status(400).json(new ApiResponse(400, null, 'Message text required'));
  }

  const message = await messageService.saveMessage(
    req.user._id,
    req.params.recipientId,
    text,
    parentMessageId
  );

  const payload = {
    _id: message._id,
    sender: message.sender,
    recipient: req.params.recipientId,
    text: message.text,
    attachments: message.attachments || [],
    parentMessage: message.parentMessage,
    reactions: message.reactions || [],
    createdAt: message.createdAt,
    read: false
  };

  // Broadcast to recipient in real-time if they are online
  try {
    const io = getIO();
    io.to(`user:${req.params.recipientId}`).emit('receive_direct_message', payload);
  } catch (err) {
    logger.warn(`Could not broadcast message over socket: ${err.message}`);
  }

  return res.status(201).json(new ApiResponse(201, payload, 'Message sent'));
});

// POST /messages/:recipientId/attachment — send attachment message
export const sendAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file attached');
  }

  const { text, parentMessageId } = req.body;
  const resourceType = getResourceType(req.file.mimetype);
  
  let attachmentType = 'document';
  if (req.file.mimetype.startsWith('image/')) attachmentType = 'image';
  else if (req.file.mimetype.startsWith('video/')) attachmentType = 'video';
  else if (req.file.mimetype.startsWith('audio/')) attachmentType = 'audio';

  const cloudResult = await uploadToCloudinary(req.file.buffer, 'chat_attachments', resourceType);

  const attachments = [
    {
      url: cloudResult.secure_url,
      publicId: cloudResult.public_id,
      type: attachmentType,
      fileName: req.file.originalname,
      fileSize: req.file.size
    }
  ];

  const message = await messageService.saveMessage(
    req.user._id,
    req.params.recipientId,
    text || '',
    parentMessageId || null,
    attachments
  );

  const payload = {
    _id: message._id,
    sender: message.sender,
    recipient: req.params.recipientId,
    text: message.text,
    attachments: message.attachments,
    parentMessage: message.parentMessage,
    reactions: message.reactions || [],
    createdAt: message.createdAt,
    read: false
  };

  try {
    const io = getIO();
    io.to(`user:${req.params.recipientId}`).emit('receive_direct_message', payload);
  } catch (err) {
    logger.warn(`Could not broadcast attachment message over socket: ${err.message}`);
  }

  return res.status(201).json(new ApiResponse(201, payload, 'Attachment sent successfully'));
});

// GET /messages/users — list all users to start a new conversation
export const getUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const users = await messageService.getUsers(req.user._id, search);
  return res.status(200).json(new ApiResponse(200, users, 'Users fetched'));
});

// POST /messages/reaction/:messageId — react to a message
export const toggleReaction = asyncHandler(async (req, res) => {
  const { emoji } = req.body;
  if (!emoji) {
    return res.status(400).json(new ApiResponse(400, null, 'Emoji is required'));
  }
  const message = await messageService.toggleReaction(req.params.messageId, req.user._id, emoji);
  return res.status(200).json(new ApiResponse(200, message, 'Reaction updated'));
});
