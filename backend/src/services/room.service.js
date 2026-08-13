import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Room } from '../models/Room.js';
import { Enrollment } from '../models/Enrollment.js';
import { ApiError } from '../utils/ApiError.js';

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key_id';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret_key_here';
  return new Razorpay({ key_id, key_secret });
};

export const createRoom = async (teacherId, data) => {
  const { title, description, price, currency } = data;
  if (!title || price === undefined || price < 0) {
    throw new ApiError(400, 'Valid title and non-negative price are required');
  }

  const room = await Room.create({
    teacher: teacherId,
    title,
    description: description || '',
    price: Number(price),
    currency: currency || 'INR',
    isActive: true
  });

  return room;
};

export const getTeacherRooms = async (teacherId) => {
  const rooms = await Room.find({ teacher: teacherId, isActive: true }).sort({ createdAt: -1 });
  return rooms;
};

export const getRoomById = async (roomId) => {
  const room = await Room.findById(roomId).populate('teacher', 'name email avatar');
  if (!room) {
    throw new ApiError(404, 'Room not found');
  }
  return room;
};

export const createRazorpayOrder = async (roomId, studentId) => {
  const room = await Room.findById(roomId);
  if (!room || !room.isActive) {
    throw new ApiError(404, 'Active room not found');
  }

  const existingEnrollment = await Enrollment.findOne({
    student: studentId,
    room: roomId,
    status: 'active'
  });

  if (existingEnrollment) {
    throw new ApiError(400, 'You are already enrolled in this room');
  }

  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key_id';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret_key_here';

  let order;
  if (keyId.includes('placeholder') || keySecret.includes('placeholder')) {
    order = {
      id: `order_mock_${roomId.slice(-6)}_${Date.now()}`,
      entity: 'order',
      amount: room.price,
      amount_paid: 0,
      amount_due: room.price,
      currency: room.currency,
      receipt: `rcpt_${roomId.slice(-6)}_${Date.now().toString().slice(-6)}`,
      status: 'created',
      attempts: 0,
      created_at: Math.floor(Date.now() / 1000)
    };
  } else {
    const razorpay = getRazorpayInstance();
    order = await razorpay.orders.create({
      amount: Math.round(room.price),
      currency: room.currency || 'INR',
      receipt: `rcpt_${roomId.slice(-6)}_${Date.now().toString().slice(-6)}`
    });
  }

  return {
    order,
    keyId,
    room: {
      _id: room._id,
      title: room.title,
      price: room.price,
      currency: room.currency
    }
  };
};

export const verifyPaymentAndEnroll = async (roomId, studentId, paymentData) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = paymentData;

  if (!razorpayOrderId || !razorpayPaymentId) {
    throw new ApiError(400, 'Razorpay order ID and payment ID are required');
  }

  const room = await Room.findById(roomId);
  if (!room || !room.isActive) {
    throw new ApiError(404, 'Active room not found');
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret_key_here';

  if (!razorpayOrderId.startsWith('order_mock_')) {
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new ApiError(400, 'Invalid payment signature. Verification failed.');
    }
  }

  const enrollment = await Enrollment.findOneAndUpdate(
    { student: studentId, room: roomId },
    {
      student: studentId,
      room: roomId,
      status: 'active',
      razorpayPaymentId,
      razorpayOrderId,
      paidAt: new Date()
    },
    { upsert: true, new: true }
  ).populate('room');

  return enrollment;
};

export const checkEnrollment = async (studentId, roomId) => {
  const enrollment = await Enrollment.findOne({
    student: studentId,
    room: roomId,
    status: 'active'
  });
  return !!enrollment;
};

export const getStudentEnrollments = async (studentId) => {
  const enrollments = await Enrollment.find({ student: studentId, status: 'active' })
    .populate({
      path: 'room',
      populate: { path: 'teacher', select: 'name email avatar' }
    })
    .sort({ paidAt: -1 });
  return enrollments;
};
