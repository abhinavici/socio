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

  if (targetUser.isPrivate) {
    // Create a pending follow request
    await Follow.create({ follower: myId, following: targetId, status: "pending" });

    // Notify the private account owner
    await Notification.create({
      recipient: targetId,
      sender: myId,
      type: "follow_request",
    });

    return res.status(201).json({ message: "Follow request sent", status: "pending" });
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
 * PATCH /api/follow/:userId/accept
 * Accept a follow request (called by the account owner)
 */
exports.acceptFollowRequest = asyncHandler(async (req, res, next) => {
  const requesterId = req.params.userId; // the person who sent the request
  const myId = req.user;

  const follow = await Follow.findOne({
    follower: requesterId,
    following: myId,
    status: "pending",
  });

  if (!follow) return next(httpError(404, "No pending follow request found"));

  follow.status = "accepted";
  await follow.save();

  // Update counts
  await User.findByIdAndUpdate(requesterId, { $inc: { followingCount: 1 } });
  await User.findByIdAndUpdate(myId, { $inc: { followersCount: 1 } });

  // Notify the requester that their request was accepted
  await Notification.create({
    recipient: requesterId,
    sender: myId,
    type: "follow_accepted",
  });

  // Remove the original follow_request notification (clean up)
  await Notification.findOneAndDelete({
    recipient: myId,
    sender: requesterId,
    type: "follow_request",
  });

  res.json({ message: "Follow request accepted" });
});

/**
 * DELETE /api/follow/:userId/reject
 * Reject a follow request
 */
exports.rejectFollowRequest = asyncHandler(async (req, res, next) => {
  const requesterId = req.params.userId;
  const myId = req.user;

  const deleted = await Follow.findOneAndDelete({
    follower: requesterId,
    following: myId,
    status: "pending",
  });

  if (!deleted) return next(httpError(404, "No pending follow request found"));

  // Clean up the notification too
  await Notification.findOneAndDelete({
    recipient: myId,
    sender: requesterId,
    type: "follow_request",
  });

  res.json({ message: "Follow request rejected" });
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
    isPending: follow?.status === "pending",
  });
});

/**
 * GET /api/follow/requests
 * Get pending follow requests for the logged-in user
 */
exports.getFollowRequests = asyncHandler(async (req, res) => {
  const requests = await Follow.find({ following: req.user, status: "pending" })
    .populate("follower", "name username avatar userId")
    .sort({ createdAt: -1 });

  res.json(requests.map((r) => r.follower));
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