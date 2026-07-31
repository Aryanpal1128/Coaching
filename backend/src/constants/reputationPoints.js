export const REPUTATION_EVENTS = {
  ACCEPTED_ANSWER: { points: 20, description: 'Answer accepted by student/teacher' },
  HIGH_AI_SCORE: { points: 15, description: 'AI Accuracy Score > 90%' },
  TEACHER_ENDORSEMENT: { points: 10, description: 'Answer endorsed by a teacher' },
  UPVOTE_RECEIVED: { points: 5, description: 'Answer or question upvoted' },
  DAILY_ACTIVITY: { points: 2, description: 'Daily active platform login' },
  DOWNVOTE_RECEIVED: { points: -2, description: 'Answer downvoted' },
  SPAM_REPORTED: { points: -10, description: 'Content reported as spam/inappropriate' }
};

export const LEVEL_THRESHOLD = [
  { level: 'Beginner', minPoints: 0, maxPoints: 100, badge: '🌱 Beginner' },
  { level: 'Learner', minPoints: 101, maxPoints: 300, badge: '📘 Learner' },
  { level: 'Contributor', minPoints: 301, maxPoints: 700, badge: '⚡ Contributor' },
  { level: 'Expert', minPoints: 701, maxPoints: 1500, badge: '🔥 Expert' },
  { level: 'Master', minPoints: 1501, maxPoints: Infinity, badge: '👑 Master' }
];

export const calculateLevelAndBadge = (reputation) => {
  const userRep = Math.max(0, reputation || 0);
  const info = LEVEL_THRESHOLD.find(
    (tier) => userRep >= tier.minPoints && userRep <= tier.maxPoints
  ) || LEVEL_THRESHOLD[0];
  
  return {
    level: info.level,
    badgeName: info.badge
  };
};
