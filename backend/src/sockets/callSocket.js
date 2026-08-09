import { Call } from '../models/Call.js';
import { User } from '../models/User.js';
import { onlineUsers } from './messageSocket.js';
import logger from '../config/logger.js';

export const setupCallSocket = (io, socket) => {
  // Initiate a call
  socket.on('call_initiate', async ({ calleeId, callerId, type = 'video' }) => {
    try {
      if (!calleeId || !callerId) return;

      // Check if callee is online
      const isOnline = onlineUsers.has(calleeId);
      if (!isOnline) {
        socket.emit('call_unavailable', { calleeId, reason: 'User is offline' });
        await Call.create({
          caller: callerId,
          callee: calleeId,
          type,
          status: 'missed',
          startedAt: new Date(),
          endedAt: new Date()
        });
        return;
      }

      const callerUser = await User.findById(callerId).select('name avatar role');

      // Relay to callee's user room
      io.to(`user:${calleeId}`).emit('call_incoming', {
        caller: callerUser || { _id: callerId, name: 'User' },
        callerId,
        type
      });
      logger.info(`Call initiated by ${callerId} to ${calleeId}`);
    } catch (err) {
      logger.error(`Error initiating call: ${err.message}`);
    }
  });

  // Accept call
  socket.on('call_accept', ({ callerId, calleeId }) => {
    io.to(`user:${callerId}`).emit('call_accepted', { calleeId });
  });

  // Reject call
  socket.on('call_reject', async ({ callerId, calleeId, type = 'video' }) => {
    io.to(`user:${callerId}`).emit('call_rejected', { calleeId });
    try {
      await Call.create({
        caller: callerId,
        callee: calleeId,
        type,
        status: 'rejected',
        startedAt: new Date(),
        endedAt: new Date()
      });
    } catch (err) {
      logger.error(`Failed to save rejected call log: ${err.message}`);
    }
  });

  // End call
  socket.on('call_end', async ({ toUserId, fromUserId, type = 'video', duration = 0, status = 'completed' }) => {
    if (toUserId) {
      io.to(`user:${toUserId}`).emit('call_ended', { fromUserId });
    }
    try {
      if (fromUserId && toUserId) {
        const endedAt = new Date();
        const startedAt = new Date(endedAt.getTime() - duration * 1000);
        await Call.create({
          caller: fromUserId,
          callee: toUserId,
          type,
          status,
          startedAt,
          endedAt,
          duration
        });
      }
    } catch (err) {
      logger.error(`Failed to save ended call log: ${err.message}`);
    }
  });

  // WebRTC signaling relay: offer, answer, ice_candidate
  socket.on('webrtc_offer', ({ toUserId, offer }) => {
    io.to(`user:${toUserId}`).emit('webrtc_offer', {
      fromUserId: socket.userId || socket.id,
      offer
    });
  });

  socket.on('webrtc_answer', ({ toUserId, answer }) => {
    io.to(`user:${toUserId}`).emit('webrtc_answer', {
      fromUserId: socket.userId || socket.id,
      answer
    });
  });

  socket.on('webrtc_ice_candidate', ({ toUserId, candidate }) => {
    io.to(`user:${toUserId}`).emit('webrtc_ice_candidate', {
      fromUserId: socket.userId || socket.id,
      candidate
    });
  });
};
