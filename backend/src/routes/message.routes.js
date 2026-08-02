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

// Send a message (HTTP fallback, socket is primary)
router.post('/:recipientId', authenticate, messageController.sendMessage);

export default router;
