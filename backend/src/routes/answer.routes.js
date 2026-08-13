import { Router } from 'express';
import * as answerController from '../controllers/answer.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { submitAnswerSchema } from '../validators/answer.validator.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.get('/mine', authenticate, answerController.getMyAnswers);
router.get('/question/:questionId', answerController.getAnswersForQuestion);

router.post(
  '/',
  authenticate,
  validate(submitAnswerSchema),
  answerController.submitAnswer
);

router.post('/:id/vote', authenticate, answerController.voteAnswer);
router.post('/:id/accept', authenticate, answerController.acceptAnswer);

router.post(
  '/:id/endorse',
  authenticate,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  answerController.endorseAnswer
);

router.post('/:id/comments', authenticate, answerController.addComment);
router.post('/comments/:commentId/replies', authenticate, answerController.addReply);

export default router;
