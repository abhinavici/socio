const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");

/**
 * GET /api/notifications
 * Get logged-in user's notifications (latest 30)
 */
exports.getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user })
    .sort({ createdAt: -1 })
    .limit(30)
    .populate("sender", "name username avatar");

  res.json(notifications);
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications (used for bell badge)
 */
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user,
    isRead: false,
  });
  res.json({ count });
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
exports.markAsRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user },
    { isRead: true }
  );
  res.json({ message: "Marked as read" });
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user, isRead: false },
    { isRead: true }
  );
  res.json({ message: "All marked as read" });
});