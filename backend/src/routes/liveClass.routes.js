import { Router } from 'express';
import * as liveClassController from '../controllers/liveClass.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { scheduleLiveClassSchema } from '../validators/liveClass.validator.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.post(
  '/schedule',
  authenticate,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  validate(scheduleLiveClassSchema),
  liveClassController.scheduleLiveClass
);

router.put(
  '/:id/start',
  authenticate,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  liveClassController.startLiveClass
);

router.put(
  '/:id/cancel',
  authenticate,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  liveClassController.cancelLiveClass
);

router.post(
  '/:id/recording',
  authenticate,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  liveClassController.uploadRecording
);

router.post('/:id/attendance', authenticate, liveClassController.recordAttendance);

export default router;
