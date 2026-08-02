import { Router } from 'express';
import { getSubjects } from '../controllers/subject.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticate, getSubjects);

export default router;
