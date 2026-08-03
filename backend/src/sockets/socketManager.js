import { Server } from 'socket.io';
import logger from '../config/logger.js';
import { setupLiveClassSocket } from './liveClassSocket.js';
import { setupNotificationSocket } from './notificationSocket.js';
import { setupMessageSocket } from './messageSocket.js';

let ioInstance = null;

// Same allowlist as Express CORS — keep in sync with app.js
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

export const initSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Socket.IO CORS: Origin '${origin}' not allowed`));
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
    setupMessageSocket(ioInstance, socket);

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
console.log("FRONTEND_URL =", process.env.FRONTEND_URL);
console.log("Allowed Origins =", allowedOrigins);