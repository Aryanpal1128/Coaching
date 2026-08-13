import { LiveClass } from '../models/LiveClass.js';
import { Attendance } from '../models/Attendance.js';
import { TeacherProfile } from '../models/TeacherProfile.js';
import { Subject } from '../models/Subject.js';
import { Enrollment } from '../models/Enrollment.js';
import { createNotification } from './notification.service.js';
import { ApiError } from '../utils/ApiError.js';

const generateJitsiLink = (classId) => {
  // Jitsi Meet public rooms — free, no signup required
  const roomId = `CoachingAI-${classId}`;
  return `https://meet.jit.si/${roomId}`;
};

export const scheduleLiveClass = async (teacherId, data) => {
  const { title, description, subject, scheduledAt, accessType, room } = data;

  const liveClass = await LiveClass.create({
    title,
    description: description || '',
    teacher: teacherId,
    subject,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
    status: 'SCHEDULED',
    accessType: accessType || 'public',
    room: room || null
  });

  // Set Jitsi Meet link using the class ID
  liveClass.meetingLink = generateJitsiLink(liveClass._id.toString());
  await liveClass.save();

  await liveClass.populate([
    { path: 'teacher', select: 'name avatar' },
    { path: 'subject', select: 'name' },
    { path: 'room', select: 'title price currency' }
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
    .populate('room', 'title price currency')
    .sort({ scheduledAt: -1 });
};

export const getLiveClass = async (classId, user = null) => {
  const liveClass = await LiveClass.findById(classId)
    .populate('teacher', 'name avatar')
    .populate('subject', 'name')
    .populate('room', 'title price currency');
  if (!liveClass) throw new ApiError(404, 'Live class not found');

  if (liveClass.accessType === 'paid' && liveClass.room) {
    const isTeacherOwner = user && (user._id.toString() === liveClass.teacher._id?.toString() || user._id.toString() === liveClass.teacher.toString());
    const isAdmin = user && user.role === 'ADMIN';

    if (!isTeacherOwner && !isAdmin) {
      const enrollment = user
        ? await Enrollment.findOne({ student: user._id, room: liveClass.room._id || liveClass.room, status: 'active' })
        : null;

      if (!enrollment) {
        throw new ApiError(403, 'Paid room enrollment required to access this live class.');
      }
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

export const recordAttendance = async (studentId, classId, user = null) => {
  const liveClass = await LiveClass.findById(classId);
  if (!liveClass) throw new ApiError(404, 'Live Class not found');

  if (liveClass.accessType === 'paid' && liveClass.room) {
    const isTeacherOwner = user && (user._id.toString() === liveClass.teacher.toString());
    const isAdmin = user && user.role === 'ADMIN';

    if (!isTeacherOwner && !isAdmin) {
      const enrollment = await Enrollment.findOne({
        student: studentId,
        room: liveClass.room,
        status: 'active'
      });

      if (!enrollment) {
        throw new ApiError(403, 'Paid room enrollment required to access this live class.');
      }
    }
  }

  const attendance = await Attendance.findOneAndUpdate(
    { liveClass: classId, student: studentId },
    { joinedAt: new Date() },
    { upsert: true, new: true }
  );

  await LiveClass.findByIdAndUpdate(classId, { $inc: { attendeesCount: 1 } });
  return attendance;
};

export const startInstantLiveClass = async (teacherId) => {
  const teacherProfile = await TeacherProfile.findOne({ user: teacherId }).populate('user', 'name');
  if (!teacherProfile) throw new ApiError(404, 'Teacher profile not found');

  // Find a subject they teach, or pick any subject from DB as fallback
  let subjectId = teacherProfile.subjectsTaught[0];
  if (!subjectId) {
    const fallbackSubject = await Subject.findOne();
    subjectId = fallbackSubject ? fallbackSubject._id : null;
  }

  const title = `Instant Live Session by ${teacherProfile.user?.name || 'Instructor'}`;

  const liveClass = await LiveClass.create({
    title,
    description: 'Instant learning session. Join now to ask questions and learn live!',
    teacher: teacherId,
    subject: subjectId,
    scheduledAt: new Date(),
    status: 'LIVE'
  });

  liveClass.meetingLink = generateJitsiLink(liveClass._id.toString());
  await liveClass.save();

  await liveClass.populate([
    { path: 'teacher', select: 'name avatar' },
    { path: 'subject', select: 'name' }
  ]);

  // Notify all followers
  if (teacherProfile.followers && teacherProfile.followers.length > 0) {
    for (const followerId of teacherProfile.followers) {
      await createNotification({
        recipient: followerId,
        sender: teacherId,
        type: 'TEACHER_LIVE_CLASS',
        title: 'Teacher is LIVE now!',
        message: `Instructor ${teacherProfile.user?.name || 'Teacher'} started an instant live class. Join immediately!`,
        link: `/live-classes`
      });
    }
  }

  return liveClass;
};
