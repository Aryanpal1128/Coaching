import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/v1/users/:userId/profile
router.get('/:userId/profile', authenticate, userController.getUserProfile);

export default router;
