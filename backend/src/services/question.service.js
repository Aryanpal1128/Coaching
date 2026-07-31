import { Question } from '../models/Question.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { Tag } from '../models/Tag.js';
import { ApiError } from '../utils/ApiError.js';

export const createQuestion = async (userId, data) => {
  const { title, description, images, attachments, tags, subject, difficulty } = data;

  if (tags && Array.isArray(tags)) {
    for (const tagName of tags) {
      await Tag.findOneAndUpdate(
        { name: tagName.toLowerCase().trim() },
        { $inc: { usageCount: 1 } },
        { upsert: true, new: true }
      );
    }
  }

  const question = await Question.create({
    title,
    description,
    images: images || [],
    attachments: attachments || [],
    tags: tags || [],
    subject: subject || null,
    difficulty: difficulty || 'Medium',
    askedBy: userId
  });

  await StudentProfile.findOneAndUpdate(
    { user: userId },
    { $inc: { askedQuestionsCount: 1 } }
  );

  return question;
};

export const getQuestionById = async (questionId) => {
  const question = await Question.findByIdAndUpdate(
    questionId,
    { $inc: { viewsCount: 1 } },
    { new: true }
  )
    .populate('askedBy', 'name email avatar reputation level badge role')
    .populate('subject', 'name code')
    .populate('acceptedAnswer');

  if (!question) throw new ApiError(404, 'Question not found');
  return question;
};

export const updateQuestion = async (questionId, userId, updateData) => {
  const question = await Question.findById(questionId);
  if (!question) throw new ApiError(404, 'Question not found');

  if (question.askedBy.toString() !== userId.toString()) {
    throw new ApiError(403, 'Unauthorized to edit this question');
  }

  Object.assign(question, updateData);
  await question.save();
  return question;
};

export const deleteQuestion = async (questionId, userId, userRole) => {
  const question = await Question.findById(questionId);
  if (!question) throw new ApiError(404, 'Question not found');

  if (question.askedBy.toString() !== userId.toString() && userRole !== 'ADMIN') {
    throw new ApiError(403, 'Unauthorized to delete this question');
  }

  await question.deleteOne();
  return true;
};

export const searchQuestions = async (filters, pagination) => {
  const { query, tag, subject, difficulty, askedBy, isSolved, sortBy } = filters;
  const page = parseInt(pagination.page || 1);
  const limit = parseInt(pagination.limit || 10);
  const skip = (page - 1) * limit;

  const filterCriteria = {};

  if (query) {
    filterCriteria.$text = { $search: query };
  }
  if (tag) {
    filterCriteria.tags = tag.toLowerCase();
  }
  if (subject) {
    filterCriteria.subject = subject;
  }
  if (difficulty) {
    filterCriteria.difficulty = difficulty;
  }
  if (askedBy) {
    filterCriteria.askedBy = askedBy;
  }
  if (isSolved !== undefined) {
    filterCriteria.isSolved = isSolved === 'true';
  }

  let sortOption = { createdAt: -1 };
  if (sortBy === 'popularity') {
    sortOption = { viewsCount: -1 };
  } else if (sortBy === 'answers') {
    sortOption = { answersCount: -1 };
  }

  const questions = await Question.find(filterCriteria)
    .populate('askedBy', 'name avatar reputation level badge')
    .populate('subject', 'name')
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  const total = await Question.countDocuments(filterCriteria);

  return {
    questions,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

export const followQuestion = async (questionId, userId) => {
  const question = await Question.findById(questionId);
  if (!question) throw new ApiError(404, 'Question not found');

  const isFollowing = question.followers.includes(userId);
  if (isFollowing) {
    question.followers.pull(userId);
  } else {
    question.followers.push(userId);
  }

  await question.save();

  await StudentProfile.findOneAndUpdate(
    { user: userId },
    isFollowing
      ? { $pull: { followingQuestions: questionId } }
      : { $addToSet: { followingQuestions: questionId } }
  );

  return { isFollowing: !isFollowing, followersCount: question.followers.length };
};

export const bookmarkQuestion = async (questionId, userId) => {
  const profile = await StudentProfile.findOne({ user: userId });
  if (!profile) throw new ApiError(404, 'Student profile not found');

  const isBookmarked = profile.bookmarkedQuestions.includes(questionId);
  if (isBookmarked) {
    profile.bookmarkedQuestions.pull(questionId);
  } else {
    profile.bookmarkedQuestions.push(questionId);
  }

  await profile.save();
  return { isBookmarked: !isBookmarked };
};
