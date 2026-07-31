import { Answer } from '../models/Answer.js';
import { User } from '../models/User.js';

export const calculateAnswerRankingScore = async (answerId) => {
  const answer = await Answer.findById(answerId).populate('author', 'reputation');
  if (!answer) return 0;

  const accuracy = answer.aiAccuracyScore || 0;
  const netVotes = Math.max(0, (answer.upvotesCount || 0) - (answer.downvotesCount || 0));
  const normalizedVotes = Math.min(netVotes * 10, 100);
  
  const authorReputation = answer.author ? answer.author.reputation || 0 : 0;
  const normalizedReputation = Math.min(authorReputation / 10, 100);
  
  // Speed component: faster response gets higher speed score up to 100
  const timeInMinutes = (answer.timeTakenSeconds || 300) / 60;
  const speedScore = Math.max(0, 100 - timeInMinutes * 2);
  
  const teacherEndorsementScore = answer.isTeacherEndorsed ? 100 : 0;
  const penalty = (answer.reportsCount || 0) * 15;

  const finalScore =
    accuracy * 0.45 +
    normalizedVotes * 0.20 +
    normalizedReputation * 0.15 +
    speedScore * 0.10 +
    teacherEndorsementScore * 0.10 -
    penalty;

  const roundedScore = Math.max(0, Math.round(finalScore * 100) / 100);

  answer.finalRankingScore = roundedScore;
  await answer.save();

  return roundedScore;
};
