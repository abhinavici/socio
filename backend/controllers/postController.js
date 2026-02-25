const Post = require("../models/Post");
const Like = require("../models/Like");
const User = require("../models/User");
const httpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");
const { deleteFromCloudinary } = require("../utils/cloudinary");

/**
 * POST /api/posts
 * Create a new post
 */
exports.createPost = asyncHandler(async (req, res, next) => {
  const { caption } = req.body;

  if (!caption?.trim() && !req.file) {
    return next(httpError(400, "Post must have a caption or an image"));
  }

  const post = await Post.create({
    author: req.user,
    caption: caption?.trim() || "",
    image: req.file?.path || "",
    imagePublicId: req.file?.filename || "",
  });

  const populated = await post.populate("author", "name username avatar");

  res.status(201).json(populated);
});

/**
 * GET /api/posts/feed
 * Get posts from people I follow + my own posts
 */
exports.getFeed = asyncHandler(async (req, res, next) => {
  const Follow = require("../models/Follow");

  // Get IDs of people I follow
  const follows = await Follow.find({ follower: req.user }).select("following");
  const followingIds = follows.map((f) => f.following);

  // Include my own posts too
  followingIds.push(req.user);

  const posts = await Post.find({ author: { $in: followingIds } })
    .populate("author", "name username avatar")
    .sort({ createdAt: -1 })
    .limit(20);

  // Check which posts I have liked
  const postIds = posts.map((p) => p._id);
  const myLikes = await Like.find({ user: req.user, post: { $in: postIds } }).select("post");
  const likedSet = new Set(myLikes.map((l) => l.post.toString()));

  const postsWithLikes = posts.map((p) => ({
    ...p.toObject(),
    isLiked: likedSet.has(p._id.toString()),
  }));

  res.json(postsWithLikes);
});

/**
 * GET /api/posts/user/:userId
 * Get all posts by a specific user
 */
exports.getUserPosts = asyncHandler(async (req, res, next) => {
  const posts = await Post.find({ author: req.params.userId })
    .populate("author", "name username avatar")
    .sort({ createdAt: -1 });

  const postIds = posts.map((p) => p._id);
  const myLikes = await Like.find({ user: req.user, post: { $in: postIds } }).select("post");
  const likedSet = new Set(myLikes.map((l) => l.post.toString()));

  const postsWithLikes = posts.map((p) => ({
    ...p.toObject(),
    isLiked: likedSet.has(p._id.toString()),
  }));

  res.json(postsWithLikes);
});

/**
 * DELETE /api/posts/:postId
 * Delete your own post
 */
exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);

  if (!post) return next(httpError(404, "Post not found"));

  if (post.author.toString() !== req.user.toString()) {
    return next(httpError(403, "You can only delete your own posts"));
  }

  // Delete image from Cloudinary if exists
  if (post.imagePublicId) {
    await deleteFromCloudinary(post.imagePublicId);
  }

  await post.deleteOne();

  // Delete all likes on this post
  await Like.deleteMany({ post: req.params.postId });

  res.json({ message: "Post deleted" });
});

/**
 * POST /api/posts/:postId/like
 * Like a post
 */
exports.likePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);
  if (!post) return next(httpError(404, "Post not found"));

  const existing = await Like.findOne({ user: req.user, post: post._id });
  if (existing) return next(httpError(400, "Already liked this post"));

  await Like.create({ user: req.user, post: post._id });
  await Post.findByIdAndUpdate(post._id, { $inc: { likesCount: 1 } });

  res.status(201).json({ message: "Post liked" });
});

/**
 * DELETE /api/posts/:postId/like
 * Unlike a post
 */
exports.unlikePost = asyncHandler(async (req, res, next) => {
  const like = await Like.findOneAndDelete({
    user: req.user,
    post: req.params.postId,
  });

  if (!like) return next(httpError(400, "You have not liked this post"));

  await Post.findByIdAndUpdate(req.params.postId, { $inc: { likesCount: -1 } });

  res.json({ message: "Post unliked" });
});