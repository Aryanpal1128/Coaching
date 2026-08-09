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
      const displayMsg = msg.text || (msg.attachments?.length > 0 ? `[${msg.attachments[0].type}]` : 'Attachment');
      convMap.set(partnerId, {
        user: partner,
        lastMessage: displayMsg,
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
    .populate('sender', 'name avatar')
    .populate({
      path: 'parentMessage',
      populate: { path: 'sender', select: 'name' }
    })
    .populate({
      path: 'reactions.user',
      select: 'name'
    });

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
export const saveMessage = async (senderId, recipientId, text, parentMessageId = null, attachments = []) => {
  const recipient = await User.findById(recipientId);
  if (!recipient) throw new ApiError(404, 'Recipient not found');

  const message = await Message.create({
    sender: senderId,
    recipient: recipientId,
    text: (text || '').trim(),
    parentMessage: parentMessageId || null,
    attachments
  });

  return message.populate([
    { path: 'sender', select: 'name avatar' },
    { path: 'parentMessage', populate: { path: 'sender', select: 'name' } },
    { path: 'reactions.user', select: 'name' }
  ]);
};

/**
 * React to a message (toggle emoji)
 */
export const toggleReaction = async (messageId, userId, emoji) => {
  const message = await Message.findById(messageId);
  if (!message) throw new ApiError(404, 'Message not found');

  const existingReactionIndex = message.reactions.findIndex(
    (r) => r.user.toString() === userId.toString() && r.emoji === emoji
  );

  if (existingReactionIndex > -1) {
    message.reactions.splice(existingReactionIndex, 1);
  } else {
    message.reactions = message.reactions.filter((r) => r.user.toString() !== userId.toString());
    message.reactions.push({ user: userId, emoji });
  }

  await message.save();
  return message.populate([
    { path: 'sender', select: 'name avatar' },
    { path: 'parentMessage', populate: { path: 'sender', select: 'name' } },
    { path: 'reactions.user', select: 'name' }
  ]);
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
