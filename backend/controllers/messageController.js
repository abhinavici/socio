const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Follow = require("../models/Follow");
const User = require("../models/User");
const httpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * GET /api/messages/conversations
 * Get all conversations for the logged-in user
 */
exports.getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user,
  })
    .populate("participants", "name username avatar")
    .populate("lastMessage")
    .sort({ updatedAt: -1 }); // Most recent chat first

  res.json(conversations);
});

/**
 * POST /api/messages/conversations/:userId
 * Start or get existing conversation with a user
 */
exports.getOrCreateConversation = asyncHandler(async (req, res, next) => {
  const myId = req.user.toString();
  const otherId = req.params.userId;

  if (myId === otherId) {
    return next(httpError(400, "You cannot message yourself"));
  }

  const otherUser = await User.findById(otherId);
  if (!otherUser) return next(httpError(404, "User not found"));

  // Check if logged-in user follows the target
  const follows = await Follow.findOne({
    follower: myId,
    following: otherId,
    status: "accepted",
  });

  if (!follows) {
    return next(httpError(403, "You must follow this user to message them"));
  }

  // Find existing conversation between these two users
  let conversation = await Conversation.findOne({
    participants: { $all: [myId, otherId] },
    $expr: { $eq: [{ $size: "$participants" }, 2] },
  }).populate("participants", "name username avatar");

  // Only create if truly doesn't exist
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [myId, otherId],
    });
    conversation = await conversation.populate("participants", "name username avatar");
  }

  res.json(conversation);
});

/**
 * GET /api/messages/conversations/:conversationId/messages
 * Load message history for a conversation (paginated)
 */
exports.getMessages = asyncHandler(async (req, res, next) => {
  const { conversationId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 30; // Load 30 messages at a time

  // Make sure this user is part of this conversation
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: req.user,
  });

  if (!conversation) {
    return next(httpError(403, "Access denied"));
  }

  const messages = await Message.find({
     conversation: conversationId,
     deletedFor: { $ne: req.user }, // exclude messages deleted for this user
  })
    .populate("sender", "name username avatar")
    .sort({ createdAt: -1 }) // Newest first
    .skip((page - 1) * limit)
    .limit(limit);

  // Mark messages as read
  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: req.user }, isRead: false },
    { isRead: true }
  );

  // Reset unread count for this user
  await Conversation.findByIdAndUpdate(conversationId, {
    $set: { [`unreadCount.${req.user}`]: 0 },
  });

  res.json(messages.reverse()); // Return oldest first for display
});

/**
 * DELETE /api/messages/:messageId/delete-for-me
 * Only hides message for the requester
 */
exports.deleteForMe = asyncHandler(async (req, res, next) => {
  const { messageId } = req.params;
  const myId = req.user;

  const message = await Message.findById(messageId);
  if (!message) return next(httpError(404, "Message not found"));

  // Add myId to deletedFor array if not already there
  if (!message.deletedFor.includes(myId)) {
    message.deletedFor.push(myId);
    await message.save();
  }

  res.json({ message: "Message deleted for you" });
});

/**
 * DELETE /api/messages/:messageId/delete-for-everyone
 * Only the sender can delete for everyone
 */
exports.deleteForEveryone = asyncHandler(async (req, res, next) => {
  const { messageId } = req.params;
  const myId = req.user.toString();

  const message = await Message.findById(messageId);
  if (!message) return next(httpError(404, "Message not found"));

  // Only the sender can delete for everyone
  if (message.sender.toString() !== myId) {
    return next(httpError(403, "You can only delete your own messages"));
  }

  message.isDeletedForEveryone = true;
  message.text = "This message was deleted";
  await message.save();

  res.json({ deleted: true, messageId });
});