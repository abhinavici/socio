const User = require("../models/User");
const httpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");
const { deleteFromCloudinary } = require("../utils/cloudinary");

/**
 * GET /api/users/me
 * Get current logged-in user's profile
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user).select("-password -avatarPublicId");
  if (!user) return next(httpError(404, "User not found"));
  res.json(user);
});

/**
 * GET /api/users/:username
 * Get any user's public profile by username
 */
exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ username: req.params.username }).select(
    "-password -avatarPublicId -email"
  );
  if (!user) return next(httpError(404, "User not found"));
  res.json(user);
});

/**
 * PUT /api/users/me
 * Update current user's profile (name, username, bio, website, isPrivate)
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, username, bio, website, isPrivate } = req.body;

  const user = await User.findById(req.user);
  if (!user) return next(httpError(404, "User not found"));

  // Check username is not taken by someone else
  if (username && username !== user.username) {
    const taken = await User.findOne({ username: username.toLowerCase().trim() });
    if (taken) return next(httpError(400, "Username already taken"));
  }

  if (name) user.name = name.trim();
  if (username) user.username = username.toLowerCase().trim();
  if (bio !== undefined) user.bio = bio;
  if (website !== undefined) user.website = website;
  if (isPrivate !== undefined) user.isPrivate = isPrivate;

  await user.save();

  const updated = await User.findById(req.user).select("-password -avatarPublicId");
  res.json(updated);
});

/**
 * PUT /api/users/me/avatar
 * Upload or replace profile picture
 */
exports.updateAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(httpError(400, "No image file provided"));

  const user = await User.findById(req.user);
  if (!user) return next(httpError(404, "User not found"));

  // Delete old avatar from Cloudinary if exists
  if (user.avatarPublicId) {
    await deleteFromCloudinary(user.avatarPublicId);
  }

  user.avatar = req.file.path;           // Cloudinary URL
  user.avatarPublicId = req.file.filename; // Cloudinary public_id

  await user.save();

  res.json({ avatar: user.avatar });
});

/**
 * DELETE /api/users/me/avatar
 * Remove profile picture
 */
exports.removeAvatar = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user);
  if (!user) return next(httpError(404, "User not found"));

  if (user.avatarPublicId) {
    await deleteFromCloudinary(user.avatarPublicId);
  }

  user.avatar = "";
  user.avatarPublicId = "";
  await user.save();

  res.json({ message: "Avatar removed" });
});

/**
 * GET /api/users/search?q=john
 * Search users by name or username
 */
exports.searchUsers = asyncHandler(async (req, res, next) => {
  const query = req.query.q?.trim();

  if (!query) return next(httpError(400, "Search query is required"));

  const users = await User.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { username: { $regex: query, $options: "i" } },
    ],
  })
    .select("name username avatar userId followersCount isPrivate")
    .limit(10);

  res.json(users);
});