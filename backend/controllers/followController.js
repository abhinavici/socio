const Follow = require("../models/Follow");
const User = require("../models/User");
const httpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * POST /api/follow/:userId
 * Follow a user
 */
exports.followUser = asyncHandler(async (req, res, next) => {
  const targetId = req.params.userId;
  const myId = req.user;

  if (targetId === myId.toString()) {
    return next(httpError(400, "You cannot follow yourself"));
  }

  const targetUser = await User.findById(targetId);
  if (!targetUser) return next(httpError(404, "User not found"));

  // Check if already following
  const existing = await Follow.findOne({ follower: myId, following: targetId });
  if (existing) return next(httpError(400, "Already following this user"));

  // Create follow relationship
  await Follow.create({ follower: myId, following: targetId });

  // Update counts
  await User.findByIdAndUpdate(myId, { $inc: { followingCount: 1 } });
  await User.findByIdAndUpdate(targetId, { $inc: { followersCount: 1 } });

  res.status(201).json({ message: "Followed successfully" });
});

/**
 * DELETE /api/follow/:userId
 * Unfollow a user
 */
exports.unfollowUser = asyncHandler(async (req, res, next) => {
  const targetId = req.params.userId;
  const myId = req.user;

  const follow = await Follow.findOneAndDelete({
    follower: myId,
    following: targetId,
  });

  if (!follow) return next(httpError(400, "You are not following this user"));

  // Update counts
  await User.findByIdAndUpdate(myId, { $inc: { followingCount: -1 } });
  await User.findByIdAndUpdate(targetId, { $inc: { followersCount: -1 } });

  res.status(200).json({ message: "Unfollowed successfully" });
});

/**
 * GET /api/follow/:userId/status
 * Check if I am following a specific user
 */
exports.getFollowStatus = asyncHandler(async (req, res, next) => {
  const targetId = req.params.userId;
  const myId = req.user;

  const follow = await Follow.findOne({ follower: myId, following: targetId });

  res.json({ isFollowing: !!follow });
});

/**
 * GET /api/follow/:userId/followers
 * Get list of followers of a user
 */
exports.getFollowers = asyncHandler(async (req, res, next) => {
  const follows = await Follow.find({ following: req.params.userId })
    .populate("follower", "name username avatar userId")
    .limit(50);

  res.json(follows.map((f) => f.follower));
});

/**
 * GET /api/follow/:userId/following
 * Get list of people a user is following
 */
exports.getFollowing = asyncHandler(async (req, res, next) => {
  const follows = await Follow.find({ follower: req.params.userId })
    .populate("following", "name username avatar userId")
    .limit(50);

  res.json(follows.map((f) => f.following));
});