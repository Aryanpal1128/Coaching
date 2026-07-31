import { Server } from 'socket.io';
import logger from '../config/logger.js';
import { setupLiveClassSocket } from './liveClassSocket.js';
import { setupNotificationSocket } from './notificationSocket.js';

let ioInstance = null;

export const initSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  ioInstance.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join personal notification channel room
    socket.on('join_user_room', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        logger.info(`Socket ${socket.id} joined notification room user:${userId}`);
      }
    });

    setupLiveClassSocket(ioInstance, socket);
    setupNotificationSocket(ioInstance, socket);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO instance not initialized!');
  }
  return ioInstance;
};
