import { Router } from 'express';
import * as roomController from '../controllers/room.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// Room Creation & Management
router.post('/', authenticate, authorize('TEACHER'), roomController.createRoom);
router.get('/mine', authenticate, authorize('TEACHER', 'ADMIN'), roomController.getMyRooms);
router.get('/my-enrollments', authenticate, roomController.getMyEnrollments);
router.get('/:teacherId', roomController.getTeacherRooms);

// Payment & Enrollment Pipeline
router.post('/:roomId/create-order', authenticate, roomController.createOrder);
router.post('/:roomId/verify-payment', authenticate, roomController.verifyPayment);

export default router;
