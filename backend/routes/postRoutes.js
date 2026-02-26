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

// app.post('/api/posts', async (req, res, next) => {
//   try {
//     const post = await Post.create(req.body);
//     res.status(201).json(post);
//   } catch (err) {
//     next(err); // Pass error to global handler
//   }
// });

module.exports = router;