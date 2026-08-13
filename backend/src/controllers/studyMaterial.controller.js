import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as studyMaterialService from '../services/studyMaterial.service.js';

export const uploadStudyMaterial = asyncHandler(async (req, res) => {
  const material = await studyMaterialService.uploadStudyMaterial(
    req.user._id,
    req.body,
    req.file
  );
  return res.status(201).json(new ApiResponse(201, material, 'Study material uploaded successfully'));
});

export const getStudyMaterials = asyncHandler(async (req, res) => {
  const { subjectId, fileType, teacherId, search } = req.query;
  const materials = await studyMaterialService.getStudyMaterials({ subjectId, fileType, teacherId, search });
  return res.status(200).json(new ApiResponse(200, materials, 'Study materials fetched'));
});

export const getStudyMaterialById = asyncHandler(async (req, res) => {
  const material = await studyMaterialService.getStudyMaterialById(req.params.id, req.user);
  return res.status(200).json(new ApiResponse(200, material, 'Study material fetched'));
});

export const getRecommendedMaterials = asyncHandler(async (req, res) => {
  const materials = await studyMaterialService.getRecommendedMaterials(req.user._id);
  return res.status(200).json(new ApiResponse(200, materials, 'Recommended materials fetched'));
});

export const deleteStudyMaterial = asyncHandler(async (req, res) => {
  const result = await studyMaterialService.deleteStudyMaterial(req.user._id, req.params.id);
  return res.status(200).json(new ApiResponse(200, result, 'Study material deleted'));
});
