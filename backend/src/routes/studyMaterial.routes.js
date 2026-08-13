import { Router } from 'express';
import * as studyMaterialController from '../controllers/studyMaterial.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// GET all study materials (any authenticated user)
router.get('/', authenticate, studyMaterialController.getStudyMaterials);

// GET recommended study materials (any authenticated user)
router.get('/recommended', authenticate, studyMaterialController.getRecommendedMaterials);

// GET single study material with paid enrollment check
router.get('/:id', authenticate, studyMaterialController.getStudyMaterialById);

// POST upload study material (teacher/admin only) — multipart file upload
router.post(
  '/',
  authenticate,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  upload.single('file'),
  studyMaterialController.uploadStudyMaterial
);

// DELETE a study material (teacher deletes own, admin deletes any)
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  studyMaterialController.deleteStudyMaterial
);

export default router;
