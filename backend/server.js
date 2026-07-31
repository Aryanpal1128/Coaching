import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { initSocket } from './src/sockets/socketManager.js';
import logger from './src/config/logger.js';

const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

server.listen(PORT, () => {
  logger.info(`🚀 Production Backend Server listening on http://localhost:${PORT}`);
  logger.info(`⚡ Socket.IO real-time engine running`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
