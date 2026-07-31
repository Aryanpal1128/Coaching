import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createSubjectSchema, createBadgeSchema } from '../validators/admin.validator.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.put('/users/:userId/suspension', adminController.toggleUserSuspension);
router.delete('/users/:userId', adminController.deleteUser);

router.get('/reports', adminController.getAllReports);
router.put('/reports/:id/resolve', adminController.resolveReport);

router.post('/subjects', validate(createSubjectSchema), adminController.createSubject);
router.post('/badges', validate(createBadgeSchema), adminController.createBadge);

router.get('/analytics', adminController.getAnalytics);

export default router;
