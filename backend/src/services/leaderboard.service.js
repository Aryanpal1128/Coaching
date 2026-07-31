import { User } from '../models/User.js';
import { ReputationHistory } from '../models/ReputationHistory.js';
import { Question } from '../models/Question.js';
import { Answer } from '../models/Answer.js';

export const getOverallLeaderboard = async (limit = 20) => {
  const users = await User.find({ isSuspended: false })
    .select('name avatar reputation level badge role')
    .sort({ reputation: -1 })
    .limit(limit);

  return users;
};

export const getPeriodicLeaderboard = async (periodDays = 7, limit = 20) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const agg = await ReputationHistory.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: '$user', totalEarned: { $sum: '$points' } } },
    { $sort: { totalEarned: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    { $unwind: '$userInfo' },
    {
      $project: {
        _id: '$userInfo._id',
        name: '$userInfo.name',
        avatar: '$userInfo.avatar',
        level: '$userInfo.level',
        badge: '$userInfo.badge',
        role: '$userInfo.role',
        periodReputation: '$totalEarned'
      }
    }
  ]);

  return agg;
};

export const getSubjectWiseLeaderboard = async (subjectId, limit = 20) => {
  const questionsInSubject = await Question.find({ subject: subjectId }).select('_id');
  const questionIds = questionsInSubject.map((q) => q._id);

  const agg = await Answer.aggregate([
    { $match: { question: { $in: questionIds } } },
    { $group: { _id: '$author', totalAnswers: { $sum: 1 }, avgScore: { $avg: '$finalRankingScore' } } },
    { $sort: { totalAnswers: -1, avgScore: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    { $unwind: '$userInfo' },
    {
      $project: {
        _id: '$userInfo._id',
        name: '$userInfo.name',
        avatar: '$userInfo.avatar',
        level: '$userInfo.level',
        badge: '$userInfo.badge',
        totalAnswers: 1,
        avgScore: { $round: ['$avgScore', 2] }
      }
    }
  ]);

  return agg;
};
