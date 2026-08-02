import mongoose from 'mongoose';

const studyMaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    fileUrl: {
      type: String,
      required: true
    },
    publicId: {
      type: String, // Cloudinary public_id for deletion
      default: ''
    },
    fileType: {
      type: String,
      enum: ['PDF', 'IMAGE', 'DOC', 'PPT', 'OTHER'],
      default: 'PDF'
    },
    fileSize: {
      type: Number, // bytes
      default: 0
    },
    fileName: {
      type: String,
      default: ''
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

export const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);
