import { LiveClass } from '../models/LiveClass.js';
import { Attendance } from '../models/Attendance.js';
import { TeacherProfile } from '../models/TeacherProfile.js';
import { createNotification } from './notification.service.js';
import { ApiError } from '../utils/ApiError.js';

export const scheduleLiveClass = async (teacherId, data) => {
  const { title, description, subject, scheduledAt } = data;

  const meetingLink = `https://meet.platform.com/room-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const liveClass = await LiveClass.create({
    title,
    description,
    teacher: teacherId,
    subject,
    scheduledAt: scheduledAt || new Date(),
    meetingLink,
    status: 'SCHEDULED'
  });

  const teacherProfile = await TeacherProfile.findOne({ user: teacherId });
  if (teacherProfile && teacherProfile.followers.length > 0) {
    for (const followerId of teacherProfile.followers) {
      await createNotification({
        recipient: followerId,
        sender: teacherId,
        type: 'TEACHER_LIVE_CLASS',
        title: 'New Live Class Scheduled',
        message: `Live Class "${title}" scheduled for ${new Date(scheduledAt || Date.now()).toLocaleString()}`,
        link: `/live-classes/${liveClass._id}`
      });
    }
  }

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

  const teacherProfile = await TeacherProfile.findOne({ user: teacherId });
  if (teacherProfile && teacherProfile.followers.length > 0) {
    for (const followerId of teacherProfile.followers) {
      await createNotification({
        recipient: followerId,
        sender: teacherId,
        type: 'TEACHER_LIVE_CLASS',
        title: 'Live Class Started NOW!',
        message: `Class "${liveClass.title}" is now LIVE! Click to join.`,
        link: `/live-classes/${liveClass._id}`
      });
    }
  }

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
