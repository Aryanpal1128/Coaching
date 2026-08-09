import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as followController from '../controllers/follow.controller.js';

const router = Router();

router.use(authenticate);

router.post('/:userId', followController.followUser);
router.delete('/:userId', followController.unfollowUser);
router.get('/:userId/followers', followController.getFollowers);
router.get('/:userId/following', followController.getFollowing);
router.get('/:userId/counts', followController.getFollowCounts);

export default router;
