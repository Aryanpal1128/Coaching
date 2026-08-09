import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { generateUniqueUsername } from '../services/auth.service.js';
import logger from '../config/logger.js';

export const migrateUsernames = async () => {
  try {
    const usersWithoutUsername = await User.find({
      $or: [
        { username: { $exists: false } },
        { username: null },
        { username: '' }
      ]
    });

    if (usersWithoutUsername.length === 0) {
      logger.info('No users found without a username. Migration skipped.');
      return;
    }

    logger.info(`Found ${usersWithoutUsername.length} user(s) missing username. Starting backfill...`);

    for (const user of usersWithoutUsername) {
      const username = await generateUniqueUsername(user.name);
      user.username = username;
      await user.save();
      logger.info(`Assigned username @${username} to user "${user.name}" (${user._id})`);
    }

    logger.info('Username migration completed successfully!');
  } catch (error) {
    logger.error('Error during username migration:', error);
  }
};

// Run directly if invoked from CLI
if (process.argv[1] && process.argv[1].endsWith('migrateUsernames.js')) {
  (async () => {
    await connectDB();
    await migrateUsernames();
    await mongoose.connection.close();
    process.exit(0);
  })();
}
