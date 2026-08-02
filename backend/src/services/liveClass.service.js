import { LiveClass } from '../models/LiveClass.js';
import { Attendance } from '../models/Attendance.js';
import { TeacherProfile } from '../models/TeacherProfile.js';
import { createNotification } from './notification.service.js';
import { ApiError } from '../utils/ApiError.js';

const generateJitsiLink = (classId) => {
  // Jitsi Meet public rooms — free, no signup required
  const roomId = `CoachingAI-${classId}`;
  return `https://meet.jit.si/${roomId}`;
};

export const scheduleLiveClass = async (teacherId, data) => {
  const { title, description, subject, scheduledAt } = data;

  const liveClass = await LiveClass.create({
    title,
    description: description || '',
    teacher: teacherId,
    subject,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
    status: 'SCHEDULED'
  });

  // Set Jitsi Meet link using the class ID
  liveClass.meetingLink = generateJitsiLink(liveClass._id.toString());
  await liveClass.save();

  await liveClass.populate([
    { path: 'teacher', select: 'name avatar' },
    { path: 'subject', select: 'name' }
  ]);

  const teacherProfile = await TeacherProfile.findOne({ user: teacherId });
  if (teacherProfile && teacherProfile.followers.length > 0) {
    for (const followerId of teacherProfile.followers) {
      await createNotification({
        recipient: followerId,
        sender: teacherId,
        type: 'TEACHER_LIVE_CLASS',
        title: 'New Live Class Scheduled',
        message: `Live Class "${title}" scheduled for ${new Date(scheduledAt || Date.now()).toLocaleString()}`,
        link: `/live-classes`
      });
    }
  }

  return liveClass;
};

export const getLiveClasses = async ({ status, teacherId } = {}) => {
  const filter = {};
  if (status) filter.status = status;
  if (teacherId) filter.teacher = teacherId;

  return LiveClass.find(filter)
    .populate('teacher', 'name avatar')
    .populate('subject', 'name')
    .sort({ scheduledAt: -1 });
};

export const getLiveClass = async (classId) => {
  const liveClass = await LiveClass.findById(classId)
    .populate('teacher', 'name avatar')
    .populate('subject', 'name');
  if (!liveClass) throw new ApiError(404, 'Live class not found');
  return liveClass;
};

export const startLiveClass = async (teacherId, classId) => {
  const liveClass = await LiveClass.findById(classId);
  if (!liveClass) throw new ApiError(404, 'Live Class not found');

  if (liveClass.teacher.toString() !== teacherId.toString()) {
    throw new ApiError(403, 'Unauthorized to start this live class');
  }

  liveClass.status = 'LIVE';
  await liveClass.save();
  await liveClass.populate([
    { path: 'teacher', select: 'name avatar' },
    { path: 'subject', select: 'name' }
  ]);

  const teacherProfile = await TeacherProfile.findOne({ user: teacherId });
  if (teacherProfile && teacherProfile.followers.length > 0) {
    for (const followerId of teacherProfile.followers) {
      await createNotification({
        recipient: followerId,
        sender: teacherId,
        type: 'TEACHER_LIVE_CLASS',
        title: 'Live Class Started NOW!',
        message: `Class "${liveClass.title}" is now LIVE! Click to join.`,
        link: `/live-classes`
      });
    }
  }

  return liveClass;
};

export const endLiveClass = async (teacherId, classId) => {
  const liveClass = await LiveClass.findById(classId);
  if (!liveClass) throw new ApiError(404, 'Live Class not found');

  if (liveClass.teacher.toString() !== teacherId.toString()) {
    throw new ApiError(403, 'Unauthorized to end this live class');
  }

  liveClass.status = 'ENDED';
  await liveClass.save();
  return liveClass;
};

export const cancelLiveClass = async (teacherId, classId) => {
  const liveClass = await LiveClass.findById(classId);
  if (!liveClass) throw new ApiError(404, 'Live Class not found');

  if (liveClass.teacher.toString() !== teacherId.toString()) {
    throw new ApiError(403, 'Unauthorized to cancel this live class');
  }

  liveClass.status = 'CANCELLED';
  await liveClass.save();
  return liveClass;
};

export const uploadRecording = async (teacherId, classId, recordingUrl) => {
  const liveClass = await LiveClass.findById(classId);
  if (!liveClass) throw new ApiError(404, 'Live Class not found');

  if (liveClass.teacher.toString() !== teacherId.toString()) {
    throw new ApiError(403, 'Unauthorized to update this live class');
  }

  liveClass.recordingUrl = recordingUrl;
  liveClass.status = 'ENDED';
  await liveClass.save();

  return liveClass;
};

export const recordAttendance = async (studentId, classId) => {
  const liveClass = await LiveClass.findById(classId);
  if (!liveClass) throw new ApiError(404, 'Live Class not found');

  const attendance = await Attendance.findOneAndUpdate(
    { liveClass: classId, student: studentId },
    { joinedAt: new Date() },
    { upsert: true, new: true }
  );

  await LiveClass.findByIdAndUpdate(classId, { $inc: { attendeesCount: 1 } });
  return attendance;
};
