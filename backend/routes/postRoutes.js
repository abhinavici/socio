const express = require("express");
const router = express.Router();
const {
  createPost,
  getFeed,
  getUserPosts,
  deletePost,
  likePost,
  unlikePost,
} = require("../controllers/postController");
const protect = require("../middleware/authMiddleware");
const { uploadPostImage } = require("../utils/cloudinary");

// All routes require login
router.get("/feed", protect, getFeed);
router.post("/", protect, uploadPostImage.single("image"), createPost);
router.get("/user/:userId", protect, getUserPosts);
router.delete("/:postId", protect, deletePost);
router.post("/:postId/like", protect, likePost);
router.delete("/:postId/like", protect, unlikePost);

module.exports = router;