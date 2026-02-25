const Comment = require("../models/Comment");
const Post = require("../models/Post");
const httpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * POST /api/comments/:postId
 * Add a comment to a post
 */
exports.addComment = asyncHandler(async (req, res, next) => {
  const { text } = req.body;

  if (!text?.trim()) {
    return next(httpError(400, "Comment text is required"));
  }

  const post = await Post.findById(req.params.postId);
  if (!post) return next(httpError(404, "Post not found"));

  const comment = await Comment.create({
    post: req.params.postId,
    author: req.user,
    text: text.trim(),
  });

  // Increment comments count on post
  await Post.findByIdAndUpdate(req.params.postId, {
    $inc: { commentsCount: 1 },
  });

  const populated = await comment.populate("author", "name username avatar");

  res.status(201).json(populated);
});

/**
 * GET /api/comments/:postId
 * Get all comments on a post
 */
exports.getComments = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);
  if (!post) return next(httpError(404, "Post not found"));

  const comments = await Comment.find({ post: req.params.postId })
    .populate("author", "name username avatar")
    .sort({ createdAt: 1 }); // oldest first

  res.json(comments);
});

/**
 * DELETE /api/comments/:commentId
 * Delete your own comment
 */
exports.deleteComment = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.commentId);

  if (!comment) return next(httpError(404, "Comment not found"));

  if (comment.author.toString() !== req.user.toString()) {
    return next(httpError(403, "You can only delete your own comments"));
  }

  await comment.deleteOne();

  // Decrement comments count on post
  await Post.findByIdAndUpdate(comment.post, {
    $inc: { commentsCount: -1 },
  });

  res.json({ message: "Comment deleted" });
});