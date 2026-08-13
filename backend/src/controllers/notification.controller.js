import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Notification } from '../models/Notification.js';

export const getUserNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  return res.status(200).json(new ApiResponse(200, notifications, 'Notifications fetched'));
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false
  });
  return res.status(200).json(new ApiResponse(200, { count }, 'Unread count fetched'));
});

export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );
  return res.status(200).json(new ApiResponse(200, notification, 'Notification marked as read'));
});
