import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

// GET /api/v1/users/username-available?value=xyz
router.get('/username-available', userController.checkUsernameAvailability);

// POST /api/v1/users/onboarding
router.post('/onboarding', authenticate, upload.single('avatar'), userController.onboardUser);

// PATCH /api/v1/users/me/username
router.patch('/me/username', authenticate, userController.updateUsername);

// PATCH /api/v1/users/me/avatar
router.patch('/me/avatar', authenticate, upload.single('avatar'), userController.updateAvatar);

// PATCH /api/v1/users/me/profile
router.patch('/me/profile', authenticate, upload.single('avatar'), userController.updateUserProfile);

// GET /api/v1/users/:userId/profile
router.get('/:userId/profile', authenticate, userController.getUserProfile);

export default router;
