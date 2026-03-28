const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const{ uploadPostImage } = require("../utils/cloudinary");
const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  deleteForMe,
  deleteForEveryone,
  uploadMessageImage,
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

// Image upload — reuse the same cloudinary upload middleware from posts
router.post(
  "/upload-image",
  protect,
  uploadPostImage.single("image"),
  uploadMessageImage
);

module.exports = router;