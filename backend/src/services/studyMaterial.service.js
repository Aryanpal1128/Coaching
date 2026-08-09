import { StudyMaterial } from '../models/StudyMaterial.js';
import { Subject } from '../models/Subject.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { TeacherProfile } from '../models/TeacherProfile.js';
import { uploadToCloudinary, deleteFromCloudinary, getResourceType } from '../middlewares/upload.middleware.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Upload a study material file to Cloudinary and save metadata to DB.
 */
export const uploadStudyMaterial = async (teacherId, data, file) => {
  if (!file) throw new ApiError(400, 'No file uploaded');

  const { title, description, subjectId, fileType } = data;

  // Validate subject exists
  const subject = await Subject.findById(subjectId);
  if (!subject) throw new ApiError(404, 'Subject not found');

  const resourceType = getResourceType(file.mimetype);
  const cloudResult = await uploadToCloudinary(file.buffer, 'study_materials', resourceType);

  const material = await StudyMaterial.create({
    title,
    description: description || '',
    fileUrl: cloudResult.secure_url,
    publicId: cloudResult.public_id,
    fileType: fileType || detectFileType(file.mimetype),
    fileSize: file.size,
    fileName: file.originalname,
    teacher: teacherId,
    subject: subjectId
  });

  return material.populate([{ path: 'teacher', select: 'name avatar' }, { path: 'subject', select: 'name' }]);
};

/**
 * Get all study materials with optional filters.
 */
export const getStudyMaterials = async ({ subjectId, fileType, teacherId, search } = {}) => {
  const filter = {};
  if (subjectId) filter.subject = subjectId;
  if (fileType) filter.fileType = fileType;
  if (teacherId) filter.teacher = teacherId;
  if (search) filter.title = { $regex: search, $options: 'i' };

  return StudyMaterial.find(filter)
    .populate('teacher', 'name avatar')
    .populate('subject', 'name')
    .sort({ createdAt: -1 });
};

/**
 * Get recommended study materials for logged in user based on profile subjects or followers.
 */
export const getRecommendedMaterials = async (userId) => {
  let userSubjects = [];
  
  const studentProfile = await StudentProfile.findOne({ user: userId });
  if (studentProfile && studentProfile.subjectsOfInterest?.length > 0) {
    userSubjects = studentProfile.subjectsOfInterest;
  } else {
    const teacherProfile = await TeacherProfile.findOne({ user: userId });
    if (teacherProfile && teacherProfile.subjectsTaught?.length > 0) {
      userSubjects = teacherProfile.subjectsTaught;
    }
  }

  const filter = {};
  if (userSubjects.length > 0) {
    filter.subject = { $in: userSubjects };
  }

  return StudyMaterial.find(filter)
    .populate('teacher', 'name avatar')
    .populate('subject', 'name')
    .sort({ createdAt: -1 })
    .limit(20);
};

/**
 * Delete a study material (teacher can only delete own materials).
 */
export const deleteStudyMaterial = async (teacherId, materialId) => {
  const material = await StudyMaterial.findById(materialId);
  if (!material) throw new ApiError(404, 'Study material not found');

  if (material.teacher.toString() !== teacherId.toString()) {
    throw new ApiError(403, 'You can only delete your own materials');
  }

  // Delete from Cloudinary
  if (material.publicId) {
    const resourceType = material.fileType === 'IMAGE' ? 'image' : 'raw';
    await deleteFromCloudinary(material.publicId, resourceType);
  }

  await material.deleteOne();
  return { deleted: true, id: materialId };
};

/**
 * Helper: detect file type from MIME type.
 */
const detectFileType = (mimetype) => {
  if (mimetype === 'application/pdf') return 'PDF';
  if (mimetype.startsWith('image/')) return 'IMAGE';
  if (mimetype.includes('word') || mimetype.includes('document')) return 'DOC';
  if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return 'PPT';
  return 'OTHER';
};
