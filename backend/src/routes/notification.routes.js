import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, notificationController.getUserNotifications);
router.get('/unread-count', authenticate, notificationController.getUnreadCount);
router.put('/:id/read', authenticate, notificationController.markNotificationAsRead);

export default router;
