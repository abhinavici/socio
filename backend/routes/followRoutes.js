const express = require("express");
const router = express.Router();
const {
  followUser,
  unfollowUser,
  getFollowStatus,
  getFollowers,
  getFollowing,
} = require("../controllers/followController");
const protect = require("../middleware/authMiddleware");

// All routes require login
router.post("/:userId", protect, followUser);
router.delete("/:userId", protect, unfollowUser);
router.get("/:userId/status", protect, getFollowStatus);
router.get("/:userId/followers", protect, getFollowers);
router.get("/:userId/following", protect, getFollowing);

module.exports = router;