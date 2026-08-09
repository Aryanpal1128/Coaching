import { Router } from 'express';
import * as messageController from '../controllers/message.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// List conversations (contacts with last message)
router.get('/conversations', authenticate, messageController.getConversations);

// Search users to start a new conversation
router.get('/users', authenticate, messageController.getUsers);

// Get chat history with a specific user
router.get('/:partnerId', authenticate, messageController.getMessages);

import { uploadChatMedia } from '../middlewares/upload.middleware.js';

// Send a message (HTTP fallback, socket is primary)
router.post('/:recipientId', authenticate, messageController.sendMessage);

// Send an attachment message
router.post('/:recipientId/attachment', authenticate, uploadChatMedia.single('file'), messageController.sendAttachment);

// React to a message
router.post('/reaction/:messageId', authenticate, messageController.toggleReaction);

export default router;
