import { Router } from 'express';
import authRoutes from './auth.routes.js';
import questionRoutes from './question.routes.js';
import answerRoutes from './answer.routes.js';
import leaderboardRoutes from './leaderboard.routes.js';
import teacherRoutes from './teacher.routes.js';
import liveClassRoutes from './liveClass.routes.js';
import notificationRoutes from './notification.routes.js';
import adminRoutes from './admin.routes.js';
import studyMaterialRoutes from './studyMaterial.routes.js';
import subjectRoutes from './subject.routes.js';
import messageRoutes from './message.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/questions', questionRoutes);
router.use('/answers', answerRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/teacher', teacherRoutes);
router.use('/live-classes', liveClassRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/study-materials', studyMaterialRoutes);
router.use('/subjects', subjectRoutes);
router.use('/messages', messageRoutes);

export default router;
