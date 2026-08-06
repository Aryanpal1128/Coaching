import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Message } from '../models/Message.js';
import logger from '../config/logger.js';

dotenv.config();

const makeFriends = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB for making friends...');

    // 1. Verify all users in the database
    const updateResult = await User.updateMany({}, { isVerified: true });
    logger.info(`Verified ${updateResult.modifiedCount} users.`);

    // 2. Fetch all users
    const users = await User.find({});
    logger.info(`Found ${users.length} users in the database.`);

    if (users.length < 2) {
      logger.info('Not enough users to create conversations. Please register or seed more users first.');
      process.exit(0);
    }

    let createdCount = 0;

    // 3. Create a two-way message between all users so they appear in each other's active chat lists
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const userA = users[i];
        const userB = users[j];

        // Check if message already exists between userA and userB
        const existingMessage = await Message.findOne({
          $or: [
            { sender: userA._id, recipient: userB._id },
            { sender: userB._id, recipient: userA._id }
          ]
        });

        if (!existingMessage) {
          // Create message from userA to userB
          await Message.create({
            sender: userA._id,
            recipient: userB._id,
            text: `Hello ${userB.name}! Welcome to the platform. Let's chat and learn together!`,
            read: true
          });

          // Create response message from userB to userA
          await Message.create({
            sender: userB._id,
            recipient: userA._id,
            text: `Hi ${userA.name}! Sounds great. Let me know if you need any help with your courses!`,
            read: true
          });

          createdCount += 2;
        }
      }
    }

    logger.info(`Created ${createdCount} messaging conversations between users.`);
    process.exit(0);
  } catch (error) {
    logger.error('Error making friends: ' + error.message);
    process.exit(1);
  }
};

makeFriends();
