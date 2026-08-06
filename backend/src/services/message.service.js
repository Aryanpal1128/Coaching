import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Get all users the current user has had a conversation with,
 * plus their last message and unread count.
 */
export const getConversations = async (userId) => {
  // Find all users this user has messaged or received messages from
  const messages = await Message.find({
    $or: [{ sender: userId }, { recipient: userId }]
  })
    .sort({ createdAt: -1 })
    .populate('sender', 'name avatar role')
    .populate('recipient', 'name avatar role');

  // Build a map of unique conversation partners
  const convMap = new Map();
  for (const msg of messages) {
    const partner =
      msg.sender._id.toString() === userId.toString() ? msg.recipient : msg.sender;
    const partnerId = partner._id.toString();
    if (!convMap.has(partnerId)) {
      convMap.set(partnerId, {
        user: partner,
        lastMessage: msg.text,
        lastMessageAt: msg.createdAt,
        unread: 0
      });
    }
    // Count unread messages sent TO me from this partner
    if (
      msg.recipient._id.toString() === userId.toString() &&
      !msg.read
    ) {
      convMap.get(partnerId).unread += 1;
    }
  }

  return Array.from(convMap.values()).sort(
    (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
  );
};

/**
 * Get message history between two users.
 */
export const getMessages = async (userId, partnerId) => {
  const messages = await Message.find({
    $or: [
      { sender: userId, recipient: partnerId },
      { sender: partnerId, recipient: userId }
    ]
  })
    .sort({ createdAt: 1 })
    .populate('sender', 'name avatar');

  // Mark all messages from partner as read
  await Message.updateMany(
    { sender: partnerId, recipient: userId, read: false },
    { read: true }
  );

  return messages;
};

/**
 * Save a message to the database.
 */
export const saveMessage = async (senderId, recipientId, text) => {
  const recipient = await User.findById(recipientId);
  if (!recipient) throw new ApiError(404, 'Recipient not found');

  const message = await Message.create({
    sender: senderId,
    recipient: recipientId,
    text: text.trim()
  });

  return message.populate('sender', 'name avatar');
};

/**
 * Get all users (for starting a new conversation).
 */
export const getUsers = async (currentUserId, search = '') => {
  const filter = { _id: { $ne: currentUserId } };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  return User.find(filter).select('name avatar role email').limit(20);
};
