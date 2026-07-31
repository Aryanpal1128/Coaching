import { TeacherProfile } from '../models/TeacherProfile.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { Assignment } from '../models/Assignment.js';
import { Notes } from '../models/Notes.js';
import { StudyMaterial } from '../models/StudyMaterial.js';
import { createNotification } from './notification.service.js';
import { ApiError } from '../utils/ApiError.js';

export const uploadStudyMaterial = async (teacherId, data) => {
  const material = await StudyMaterial.create({
    ...data,
    teacher: teacherId
  });
  return material;
};

export const createNotes = async (teacherId, data) => {
  const notes = await Notes.create({
    ...data,
    teacher: teacherId
  });

  const teacherProfile = await TeacherProfile.findOne({ user: teacherId });
  if (teacherProfile && teacherProfile.followers.length > 0) {
    for (const followerId of teacherProfile.followers) {
      await createNotification({
        recipient: followerId,
        sender: teacherId,
        type: 'TEACHER_NOTES',
        title: 'New Study Notes Uploaded',
        message: `Teacher posted new notes: "${notes.title}"`,
        link: `/notes/${notes._id}`
      });
    }
  }

  return notes;
};

export const createAssignment = async (teacherId, data) => {
  const assignment = await Assignment.create({
    ...data,
    teacher: teacherId
  });

  const teacherProfile = await TeacherProfile.findOne({ user: teacherId });
  if (teacherProfile && teacherProfile.followers.length > 0) {
    for (const followerId of teacherProfile.followers) {
      await createNotification({
        recipient: followerId,
        sender: teacherId,
        type: 'ASSIGNMENT_POSTED',
        title: 'New Assignment Uploaded',
        message: `New assignment: "${assignment.title}" (Due: ${new Date(assignment.dueDate).toLocaleDateString()})`,
        link: `/assignments/${assignment._id}`
      });
    }
  }

  return assignment;
};

export const followTeacher = async (studentId, teacherId) => {
  const teacherProfile = await TeacherProfile.findOne({ user: teacherId });
  if (!teacherProfile) throw new ApiError(404, 'Teacher profile not found');

  const studentProfile = await StudentProfile.findOne({ user: studentId });
  if (!studentProfile) throw new ApiError(404, 'Student profile not found');

  const isFollowing = teacherProfile.followers.includes(studentId);
  if (isFollowing) {
    teacherProfile.followers.pull(studentId);
    studentProfile.followingTeachers.pull(teacherId);
  } else {
    teacherProfile.followers.push(studentId);
    studentProfile.followingTeachers.push(teacherId);
  }

  await teacherProfile.save();
  await studentProfile.save();

  return { isFollowing: !isFollowing, followerCount: teacherProfile.followers.length };
};
