import 'dotenv/config';

import http from 'http';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { initSocket } from './src/sockets/socketManager.js';
import logger from './src/config/logger.js';

const PORT = process.env.PORT || 5001;

connectDB();

const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  logger.info(`🚀 Server listening on port ${PORT}`);
  logger.info(`FRONTEND_URL = ${process.env.FRONTEND_URL}`);
  logger.info(`Environment = ${process.env.NODE_ENV}`);
});