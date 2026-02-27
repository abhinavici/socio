const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  deleteForMe,
  deleteForEveryone,
} = require("../controllers/messageController");

// Get all my conversations (inbox)
router.get("/conversations", protect, getConversations);

// Start or open a conversation with a user
router.post("/conversations/:userId", protect, getOrCreateConversation);

// Get message history for a conversation
router.get("/conversations/:conversationId/messages", protect, getMessages);

// Delete a message for the current user only
router.delete("/:messageId/delete-for-me", protect, deleteForMe);

// Delete a message for everyone (sender only)
router.delete("/:messageId/delete-for-everyone", protect, deleteForEveryone);

module.exports = router;