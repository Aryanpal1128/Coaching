import mongoose from 'mongoose';
import logger from './logger.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.warn(`MongoDB Connection Warning: ${error.message}. Running with fallback or pending DB connection.`);
  }
};
