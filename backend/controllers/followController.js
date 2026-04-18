const Follow = require("../models/Follow");
const User = require("../models/User");
const Notification = require("../models/Notification");
const httpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * POST /api/follow/:userId
 * Follow or request to follow a user
 */
exports.followUser = asyncHandler(async (req, res, next) => {
  const targetId = req.params.userId;
  const myId = req.user;

  if (targetId === myId.toString()) {
    return next(httpError(400, "You cannot follow yourself"));
  }

  const targetUser = await User.findById(targetId);
  if (!targetUser) return next(httpError(404, "User not found"));

  const existing = await Follow.findOne({ follower: myId, following: targetId });
  if (existing) {
    const msg = existing.status === "pending"
      ? "Follow request already sent"
      : "Already following this user";
    return next(httpError(400, msg));
  }

  // Public account — follow immediately
  await Follow.create({ follower: myId, following: targetId, status: "accepted" });
  await User.findByIdAndUpdate(myId, { $inc: { followingCount: 1 } });
  await User.findByIdAndUpdate(targetId, { $inc: { followersCount: 1 } });

  // Notify the followed user
  await Notification.create({
    recipient: targetId,
    sender: myId,
    type: "new_follower",
  });

  res.status(201).json({ message: "Followed successfully", status: "accepted" });
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

  // Only decrement counts if the follow was accepted
  if (follow.status === "accepted") {
    await User.findByIdAndUpdate(myId, { $inc: { followingCount: -1 } });
    await User.findByIdAndUpdate(targetId, { $inc: { followersCount: -1 } });
  }

  res.status(200).json({ message: "Unfollowed successfully" });
});

/**
 * GET /api/follow/:userId/status
 */
exports.getFollowStatus = asyncHandler(async (req, res) => {
  const targetId = req.params.userId;
  const myId = req.user;

  const follow = await Follow.findOne({ follower: myId, following: targetId });

  res.json({
    isFollowing: follow?.status === "accepted",
  });
});

/**
 * GET /api/follow/:userId/followers
 */
exports.getFollowers = asyncHandler(async (req, res) => {
  const follows = await Follow.find({ following: req.params.userId, status: "accepted" })
    .populate("follower", "name username avatar userId")
    .limit(50);

  res.json(follows.map((f) => f.follower));
});

/**
 * GET /api/follow/:userId/following
 */
exports.getFollowing = asyncHandler(async (req, res) => {
  const follows = await Follow.find({ follower: req.params.userId, status: "accepted" })
    .populate("following", "name username avatar userId")
    .limit(50);

  res.json(follows.map((f) => f.following));
});