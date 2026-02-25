const express = require("express");
const router = express.Router();
const {
  getMe,
  getProfile,
  updateProfile,
  updateAvatar,
  removeAvatar,
  searchUsers,
} = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");
const { uploadAvatar } = require("../utils/cloudinary");

// All routes below require login
router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);
router.put("/me/avatar", protect, uploadAvatar.single("avatar"), updateAvatar);
router.delete("/me/avatar", protect, removeAvatar);

// Public route — view anyone's profile
router.get("/search", protect, searchUsers);
router.get("/:username", getProfile);

module.exports = router;
