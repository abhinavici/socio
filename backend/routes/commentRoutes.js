const express = require("express");
const router = express.Router();
const {
  addComment,
  getComments,
  deleteComment,
} = require("../controllers/commentController");
const protect = require("../middleware/authMiddleware");

// All routes require login
router.post("/:postId", protect, addComment);
router.get("/:postId", protect, getComments);
router.delete("/:commentId", protect, deleteComment);

module.exports = router;