import { Router } from 'express';
import * as liveClassController from '../controllers/liveClass.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { scheduleLiveClassSchema } from '../validators/liveClass.validator.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// GET all live classes (any authenticated user)
router.get('/', authenticate, liveClassController.getLiveClasses);

// POST start an instant live class (teacher/admin)
router.post(
  '/instant',
  authenticate,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  liveClassController.startInstantLiveClass
);

// GET single live class by ID
router.get('/:id', authenticate, liveClassController.getLiveClass);

// POST schedule a new live class (teacher/admin)
router.post(
  '/schedule',
  authenticate,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  validate(scheduleLiveClassSchema),
  liveClassController.scheduleLiveClass
);

// PUT start a live class
router.put(
  '/:id/start',
  authenticate,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  liveClassController.startLiveClass
);

// PUT end a live class
router.put(
  '/:id/end',
  authenticate,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  liveClassController.endLiveClass
);

// PUT cancel a live class
router.put(
  '/:id/cancel',
  authenticate,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  liveClassController.cancelLiveClass
);

// POST upload recording URL
router.post(
  '/:id/recording',
  authenticate,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  liveClassController.uploadRecording
);

// POST record student attendance when joining
router.post('/:id/attendance', authenticate, liveClassController.recordAttendance);

export default router;
