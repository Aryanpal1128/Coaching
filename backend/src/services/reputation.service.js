import { User } from '../models/User.js';
import { ReputationHistory } from '../models/ReputationHistory.js';
import { calculateLevelAndBadge } from '../constants/reputationPoints.js';
import logger from '../config/logger.js';

export const updateReputation = async (userId, eventKey, customPoints = null, description = '', referenceId = null) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const points = customPoints !== null ? customPoints : 0;
    const newReputation = Math.max(0, user.reputation + points);
    
    const { level, badgeName } = calculateLevelAndBadge(newReputation);

    user.reputation = newReputation;
    user.level = level;
    user.badge = badgeName;
    await user.save();

    await ReputationHistory.create({
      user: userId,
      points,
      event: eventKey,
      description: description || `Points earned/deducted for ${eventKey}`,
      referenceId
    });

    logger.info(`User ${userId} reputation updated by ${points} (Total: ${newReputation}, Level: ${level})`);
    return { reputation: newReputation, level, badge: badgeName };
  } catch (error) {
    logger.error(`Error updating reputation for user ${userId}: ${error.message}`);
    return null;
  }
};
