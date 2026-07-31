import { Notification } from '../models/Notification.js';
import { getIO } from '../sockets/socketManager.js';
import { sendRealtimeNotification } from '../sockets/notificationSocket.js';
import logger from '../config/logger.js';

export const createNotification = async ({ recipient, sender, type, title, message, link }) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      link
    });

    try {
      const io = getIO();
      sendRealtimeNotification(io, recipient.toString(), notification);
    } catch (err) {
      logger.debug('Socket IO not connected for notification push');
    }

    return notification;
  } catch (error) {
    logger.error(`Error creating notification: ${error.message}`);
    return null;
  }
};
