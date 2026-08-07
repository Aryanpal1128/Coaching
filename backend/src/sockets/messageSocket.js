import { saveMessage, toggleReaction } from '../services/message.service.js';
import logger from '../config/logger.js';

// Track online users: userId → socketId
const onlineUsers = new Map();

export const setupMessageSocket = (io, socket) => {
  // Register user as online
  socket.on('user_online', (userId) => {
    if (userId) {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      // Broadcast online status to everyone
      io.emit('user_status', { userId, online: true });
      logger.info(`User ${userId} is online`);
    }
  });

  // Send a direct message
  socket.on('send_direct_message', async ({ recipientId, text, senderId, parentMessageId = null }) => {
    if (!text?.trim() || !recipientId || !senderId) return;

    try {
      // Save to DB
      const message = await saveMessage(senderId, recipientId, text, parentMessageId);

      const payload = {
        _id: message._id,
        sender: message.sender,
        recipient: recipientId,
        text: message.text,
        parentMessage: message.parentMessage,
        reactions: message.reactions || [],
        createdAt: message.createdAt,
        read: false
      };

      // Deliver to recipient if online (their personal room)
      io.to(`user:${recipientId}`).emit('receive_direct_message', payload);

      // Echo back to sender's other tabs/devices
      socket.emit('message_sent', payload);

    } catch (err) {
      logger.error('Direct message error: ' + err.message);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Toggle reaction on a message
  socket.on('message_reaction', async ({ messageId, emoji, userId, recipientId }) => {
    if (!messageId || !emoji || !userId) return;

    try {
      const message = await toggleReaction(messageId, userId, emoji);

      const payload = {
        messageId,
        reactions: message.reactions
      };

      // Deliver updated reaction to recipient and sender rooms
      io.to(`user:${recipientId}`).emit('message_reaction_updated', payload);
      io.to(`user:${userId}`).emit('message_reaction_updated', payload);

    } catch (err) {
      logger.error('Reaction socket error: ' + err.message);
    }
  });

  // Typing indicator
  socket.on('typing_start', ({ recipientId, senderName }) => {
    io.to(`user:${recipientId}`).emit('user_typing', { senderName, typing: true });
  });

  socket.on('typing_stop', ({ recipientId }) => {
    io.to(`user:${recipientId}`).emit('user_typing', { typing: false });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('user_status', { userId: socket.userId, online: false });
    }
  });
};

export const getOnlineUsers = () => onlineUsers;
