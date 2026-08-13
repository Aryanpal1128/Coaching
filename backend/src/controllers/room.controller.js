import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as roomService from '../services/room.service.js';

export const createRoom = asyncHandler(async (req, res) => {
  const room = await roomService.createRoom(req.user._id, req.body);
  return res.status(201).json(new ApiResponse(201, room, 'Room created successfully'));
});

export const getMyRooms = asyncHandler(async (req, res) => {
  const rooms = await roomService.getTeacherRooms(req.user._id);
  return res.status(200).json(new ApiResponse(200, rooms, 'Teacher rooms fetched'));
});

export const getTeacherRooms = asyncHandler(async (req, res) => {
  const rooms = await roomService.getTeacherRooms(req.params.teacherId);
  return res.status(200).json(new ApiResponse(200, rooms, 'Teacher rooms fetched'));
});

export const createOrder = asyncHandler(async (req, res) => {
  const result = await roomService.createRazorpayOrder(req.params.roomId, req.user._id);
  return res.status(200).json(new ApiResponse(200, result, 'Razorpay order created successfully'));
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const enrollment = await roomService.verifyPaymentAndEnroll(
    req.params.roomId,
    req.user._id,
    req.body
  );
  return res.status(200).json(new ApiResponse(200, enrollment, 'Payment verified and enrollment active'));
});

export const getMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await roomService.getStudentEnrollments(req.user._id);
  return res.status(200).json(new ApiResponse(200, enrollments, 'Student enrollments fetched'));
});
