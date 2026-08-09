import { Router } from 'express';
import * as questionController from '../controllers/question.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createQuestionSchema } from '../validators/question.validator.js';

const router = Router();

router.get('/search', questionController.searchQuestions);
router.get('/saved/list', authenticate, questionController.getSavedQuestions);
router.post('/suggest', authenticate, questionController.suggestQuestionImprovements);
router.get('/:id', questionController.getQuestionById);

router.post(
  '/',
  authenticate,
  validate(createQuestionSchema),
  questionController.createQuestion
);

router.put('/:id', authenticate, questionController.updateQuestion);
router.delete('/:id', authenticate, questionController.deleteQuestion);

router.post('/:id/follow', authenticate, questionController.followQuestion);
router.post('/:id/bookmark', authenticate, questionController.bookmarkQuestion);

export default router;
