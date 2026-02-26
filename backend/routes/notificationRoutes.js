const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");

router.get("/", auth, getNotifications);
router.get("/unread-count", auth, getUnreadCount);
router.patch("/:id/read", auth, markAsRead);
router.patch("/read-all", auth, markAllAsRead);

module.exports = router;