import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// PATCH /api/v1/users/me/username
router.patch('/me/username', authenticate, userController.updateUsername);

// GET /api/v1/users/:userId/profile
router.get('/:userId/profile', authenticate, userController.getUserProfile);

export default router;
