import { Router } from 'express';
import * as leaderboardController from '../controllers/leaderboard.controller.js';

const router = Router();

router.get('/overall', leaderboardController.getOverallLeaderboard);
router.get('/weekly', leaderboardController.getWeeklyLeaderboard);
router.get('/monthly', leaderboardController.getMonthlyLeaderboard);
router.get('/subject/:subjectId', leaderboardController.getSubjectLeaderboard);

export default router;
