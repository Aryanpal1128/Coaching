import multer from 'multer';
import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from '../utils/ApiError.js';

// Memory storage — stream directly to Cloudinary without writing to disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-matroska',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `Unsupported file type: ${file.mimetype}`), false);
  }
};

const chatAllowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

const chatFileFilter = (req, file, cb) => {
  if (chatAllowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `Unsupported file type: ${file.mimetype}`), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 250 * 1024 * 1024 } // 250 MB for video/materials
});

export const uploadChatMedia = multer({
  storage,
  fileFilter: chatFileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB for videos/chat attachments
});

/**
 * Configure Cloudinary lazily so env vars are always loaded first.
 * (ES modules hoist all imports before dotenv.config() runs in server.js)
 */
const getCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  return cloudinary;
};

/**
 * Uploads a file buffer to Cloudinary and returns the result.
 */
export const uploadToCloudinary = (buffer, folder = 'study_materials', resourceType = 'raw') => {
  return new Promise((resolve, reject) => {
    const cl = getCloudinary();
    const stream = cl.uploader.upload_stream(
      { folder, resource_type: resourceType, use_filename: true, unique_filename: true },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

/**
 * Deletes a file from Cloudinary by public_id.
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'raw') => {
  const cl = getCloudinary();
  return cl.uploader.destroy(publicId, { resource_type: resourceType });
};

/**
 * Maps MIME type to Cloudinary resource_type.
 */
export const getResourceType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/') || mimetype.startsWith('audio/')) return 'video';
  return 'raw'; // PDFs, DOCs treated as raw
};
