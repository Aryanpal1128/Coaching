import { Router } from 'express';
import * as teacherController from '../controllers/teacher.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.post(
  '/materials',
  authenticate,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  teacherController.uploadStudyMaterial
);

router.post(
  '/notes',
  authenticate,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  teacherController.createNotes
);

router.post(
  '/assignments',
  authenticate,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  teacherController.createAssignment
);

router.post('/follow/:teacherId', authenticate, teacherController.followTeacher);

export default router;
