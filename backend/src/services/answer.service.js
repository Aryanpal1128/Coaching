import { Answer } from '../models/Answer.js';
import { Question } from '../models/Question.js';
import { Comment } from '../models/Comment.js';
import { Reply } from '../models/Reply.js';
import { Vote } from '../models/Vote.js';
import { ApiError } from '../utils/ApiError.js';
import { evaluateAnswerWithAI } from './aiEvaluation.service.js';
import { calculateAnswerRankingScore } from './ranking.service.js';
import { updateReputation } from './reputation.service.js';
import { createNotification } from './notification.service.js';
import { REPUTATION_EVENTS } from '../constants/reputationPoints.js';

export const submitAnswer = async (userId, questionId, answerText, images, attachments, timeTakenSeconds) => {
  const question = await Question.findById(questionId);
  if (!question) throw new ApiError(404, 'Question not found');

  const answer = await Answer.create({
    question: questionId,
    author: userId,
    answerText,
    images: images || [],
    attachments: attachments || [],
    timeTakenSeconds: timeTakenSeconds || 120
  });

  await Question.findByIdAndUpdate(questionId, { $inc: { answersCount: 1 } });

  // Trigger AI Evaluation in background / async
  const aiEvaluation = await evaluateAnswerWithAI(
    question.title,
    question.description,
    answerText
  );

  answer.aiAccuracyScore = aiEvaluation.accuracyScore;
  answer.aiEvaluation = aiEvaluation;
  await answer.save();

  // Recalculate dynamic ranking score
  await calculateAnswerRankingScore(answer._id);

  // If AI score > 90, award bonus reputation points
  if (aiEvaluation.accuracyScore > 90) {
    await updateReputation(
      userId,
      'HIGH_AI_SCORE',
      REPUTATION_EVENTS.HIGH_AI_SCORE.points,
      'High AI Accuracy Answer (>90%)',
      answer._id
    );
  }

  // Send Notification to Question Author
  if (question.askedBy.toString() !== userId.toString()) {
    await createNotification({
      recipient: question.askedBy,
      sender: userId,
      type: 'QUESTION_ANSWERED',
      title: 'New Answer Received',
      message: `Your question "${question.title.substring(0, 30)}..." received a new answer!`,
      link: `/questions/${questionId}`
    });
  }

  return answer;
};

export const getAnswersForQuestion = async (questionId) => {
  const answers = await Answer.find({ question: questionId })
    .populate('author', 'name avatar reputation level badge role')
    .populate('endorsedByTeacher', 'name avatar role')
    .sort({ isAccepted: -1, finalRankingScore: -1 });

  return answers;
};

export const voteAnswer = async (userId, answerId, voteType) => {
  const answer = await Answer.findById(answerId);
  if (!answer) throw new ApiError(404, 'Answer not found');

  const existingVote = await Vote.findOne({ user: userId, answer: answerId });

  if (existingVote) {
    if (existingVote.voteType === voteType) {
      // Remove vote
      await existingVote.deleteOne();
      if (voteType === 'UPVOTE') {
        answer.upvotesCount = Math.max(0, answer.upvotesCount - 1);
        answer.upvotedBy.pull(userId);
      } else {
        answer.downvotesCount = Math.max(0, answer.downvotesCount - 1);
        answer.downvotedBy.pull(userId);
      }
    } else {
      // Change vote direction
      existingVote.voteType = voteType;
      await existingVote.save();

      if (voteType === 'UPVOTE') {
        answer.upvotesCount += 1;
        answer.downvotesCount = Math.max(0, answer.downvotesCount - 1);
        answer.upvotedBy.push(userId);
        answer.downvotedBy.pull(userId);

        await updateReputation(
          answer.author,
          'UPVOTE_RECEIVED',
          REPUTATION_EVENTS.UPVOTE_RECEIVED.points,
          'Upvote received on answer',
          answer._id
        );
      } else {
        answer.downvotesCount += 1;
        answer.upvotesCount = Math.max(0, answer.upvotesCount - 1);
        answer.downvotedBy.push(userId);
        answer.upvotedBy.pull(userId);

        await updateReputation(
          answer.author,
          'DOWNVOTE_RECEIVED',
          REPUTATION_EVENTS.DOWNVOTE_RECEIVED.points,
          'Downvote received on answer',
          answer._id
        );
      }
    }
  } else {
    // New vote
    await Vote.create({ user: userId, answer: answerId, voteType });
    if (voteType === 'UPVOTE') {
      answer.upvotesCount += 1;
      answer.upvotedBy.push(userId);
      await updateReputation(
        answer.author,
        'UPVOTE_RECEIVED',
        REPUTATION_EVENTS.UPVOTE_RECEIVED.points,
        'Upvote received on answer',
        answer._id
      );

      await createNotification({
        recipient: answer.author,
        sender: userId,
        type: 'ANSWER_UPVOTED',
        title: 'Answer Upvoted',
        message: 'Your answer received an upvote!',
        link: `/questions/${answer.question}`
      });
    } else {
      answer.downvotesCount += 1;
      answer.downvotedBy.push(userId);
      await updateReputation(
        answer.author,
        'DOWNVOTE_RECEIVED',
        REPUTATION_EVENTS.DOWNVOTE_RECEIVED.points,
        'Downvote received on answer',
        answer._id
      );
    }
  }

  await answer.save();
  await calculateAnswerRankingScore(answer._id);

  return { upvotes: answer.upvotesCount, downvotes: answer.downvotesCount };
};

export const acceptAnswer = async (userId, answerId) => {
  const answer = await Answer.findById(answerId);
  if (!answer) throw new ApiError(404, 'Answer not found');

  const question = await Question.findById(answer.question);
  if (!question) throw new ApiError(404, 'Question not found');

  if (question.askedBy.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the question author can accept an answer');
  }

  // Toggle off previous accepted answer
  if (question.acceptedAnswer) {
    await Answer.findByIdAndUpdate(question.acceptedAnswer, { isAccepted: false });
  }

  answer.isAccepted = true;
  await answer.save();

  question.isSolved = true;
  question.status = 'SOLVED';
  question.acceptedAnswer = answer._id;
  await question.save();

  await updateReputation(
    answer.author,
    'ACCEPTED_ANSWER',
    REPUTATION_EVENTS.ACCEPTED_ANSWER.points,
    'Answer marked as accepted solution',
    answer._id
  );

  return answer;
};

export const endorseAnswer = async (teacherId, answerId) => {
  const answer = await Answer.findById(answerId);
  if (!answer) throw new ApiError(404, 'Answer not found');

  answer.isTeacherEndorsed = true;
  answer.endorsedByTeacher = teacherId;
  await answer.save();

  await updateReputation(
    answer.author,
    'TEACHER_ENDORSEMENT',
    REPUTATION_EVENTS.TEACHER_ENDORSEMENT.points,
    'Answer endorsed by teacher',
    answer._id
  );

  await calculateAnswerRankingScore(answer._id);
  return answer;
};

export const addComment = async (userId, answerId, text) => {
  const comment = await Comment.create({
    answer: answerId,
    author: userId,
    text
  });
  return comment;
};

export const addReply = async (userId, commentId, text) => {
  const reply = await Reply.create({
    comment: commentId,
    author: userId,
    text
  });
  return reply;
};

export const getMyAnswers = async (userId) => {
  return Answer.find({ author: userId })
    .populate('question', 'title _id subject difficulty askedBy')
    .sort({ createdAt: -1 });
};
