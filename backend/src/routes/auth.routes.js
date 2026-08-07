import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import * as authValidator from '../validators/auth.validator.js';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validate(authValidator.registerSchema),
  authController.register
);

router.post('/verify-otp', authController.verifyOTP);

router.post(
  '/login',
  authRateLimiter,
  validate(authValidator.loginSchema),
  authController.login
);

router.post('/google', authRateLimiter, authController.googleAuth);

router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);

router.post(
  '/forgot-password',
  validate(authValidator.forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  validate(authValidator.resetPasswordSchema),
  authController.resetPassword
);

router.post(
  '/change-password',
  authenticate,
  validate(authValidator.changePasswordSchema),
  authController.changePassword
);

router.get('/me', authenticate, authController.getMe);

export default router;
