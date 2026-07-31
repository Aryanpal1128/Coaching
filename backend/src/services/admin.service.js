import { User } from '../models/User.js';
import { Question } from '../models/Question.js';
import { Answer } from '../models/Answer.js';
import { Report } from '../models/Report.js';
import { Subject } from '../models/Subject.js';
import { Badge } from '../models/Badge.js';
import { LiveClass } from '../models/LiveClass.js';
import { ApiError } from '../utils/ApiError.js';

export const toggleUserSuspension = async (userId, isSuspended) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  user.isSuspended = isSuspended;
  await user.save();

  return { _id: user._id, name: user.name, isSuspended: user.isSuspended };
};

export const deleteUserByAdmin = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  await user.deleteOne();
  return true;
};

export const getAllReports = async (status = 'PENDING') => {
  const reports = await Report.find({ status })
    .populate('reporter', 'name email role')
    .sort({ createdAt: -1 });

  return reports;
};

export const resolveReport = async (reportId, action) => {
  const report = await Report.findById(reportId);
  if (!report) throw new ApiError(404, 'Report not found');

  if (action === 'DELETE_CONTENT') {
    if (report.targetType === 'QUESTION') {
      await Question.findByIdAndDelete(report.targetId);
    } else if (report.targetType === 'ANSWER') {
      await Answer.findByIdAndDelete(report.targetId);
    }
  }

  report.status = 'RESOLVED';
  await report.save();

  return report;
};

export const createSubject = async (name, code, description) => {
  const subject = await Subject.create({ name, code, description });
  return subject;
};

export const createBadge = async (name, description, icon, minReputation, category) => {
  const badge = await Badge.create({ name, description, icon, minReputation, category });
  return badge;
};

export const getPlatformAnalytics = async () => {
  const totalUsers = await User.countDocuments();
  const totalStudents = await User.countDocuments({ role: 'STUDENT' });
  const totalTeachers = await User.countDocuments({ role: 'TEACHER' });
  const totalQuestions = await Question.countDocuments();
  const totalAnswers = await Answer.countDocuments();
  const totalLiveClasses = await LiveClass.countDocuments();
  const pendingReports = await Report.countDocuments({ status: 'PENDING' });

  return {
    users: { total: totalUsers, students: totalStudents, teachers: totalTeachers },
    content: { questions: totalQuestions, answers: totalAnswers, liveClasses: totalLiveClasses },
    moderation: { pendingReports }
  };
};
