import { Follow } from '../models/Follow.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { createNotification } from './notification.service.js';

export const followUser = async (followerId, targetId) => {
  if (followerId.toString() === targetId.toString()) {
    throw new ApiError(400, 'You cannot follow yourself');
  }

  const target = await User.findById(targetId);
  if (!target) {
    throw new ApiError(404, 'User not found');
  }

  const existing = await Follow.findOne({ follower: followerId, following: targetId });
  if (existing) {
    return { isFollowing: true, message: 'Already following' };
  }

  await Follow.create({ follower: followerId, following: targetId });

  const followerUser = await User.findById(followerId).select('name');
  await createNotification({
    recipient: targetId,
    sender: followerId,
    type: 'NEW_FOLLOWER',
    title: 'New Follower',
    message: `${followerUser?.name || 'Someone'} started following you.`,
    link: `/profile/${followerId}`
  });

  return { isFollowing: true, message: 'User followed successfully' };
};

export const unfollowUser = async (followerId, targetId) => {
  await Follow.deleteOne({ follower: followerId, following: targetId });
  return { isFollowing: false, message: 'User unfollowed successfully' };
};

export const getFollowers = async (userId, pagination = {}) => {
  const page = parseInt(pagination.page || 1);
  const limit = parseInt(pagination.limit || 20);
  const skip = (page - 1) * limit;

  const follows = await Follow.find({ following: userId })
    .populate('follower', 'name email avatar role reputation level badge')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Follow.countDocuments({ following: userId });

  return {
    users: follows.map((f) => f.follower),
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

export const getFollowing = async (userId, pagination = {}) => {
  const page = parseInt(pagination.page || 1);
  const limit = parseInt(pagination.limit || 20);
  const skip = (page - 1) * limit;

  const follows = await Follow.find({ follower: userId })
    .populate('following', 'name email avatar role reputation level badge')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Follow.countDocuments({ follower: userId });

  return {
    users: follows.map((f) => f.following),
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

export const getFollowCounts = async (userId) => {
  const [followers, following] = await Promise.all([
    Follow.countDocuments({ following: userId }),
    Follow.countDocuments({ follower: userId })
  ]);
  return { followers, following };
};

export const isFollowing = async (followerId, targetId) => {
  if (!followerId || !targetId) return false;
  const count = await Follow.countDocuments({ follower: followerId, following: targetId });
  return count > 0;
};
