const Notification = require("../models/Notification");
const { asyncHandler, sendSuccess } = require("../utils/apiResponse");

/**
 * GET /api/notifications
 * Returns the authenticated user's own notifications, newest first.
 * A user only ever sees notifications addressed to them — the query
 * is always scoped to req.user._id, never to a value from the client.
 */
const listNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);

  const notifications = await Notification.find({ organizationId: req.organizationId, recipient: req.user._id })
    .populate("ticket", "ticketId title")
    .populate("actor", "name role")
    .sort({ createdAt: -1 })
    .limit(limit);

  return sendSuccess(res, 200, notifications);
});

/**
 * GET /api/notifications/unread-count
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ organizationId: req.organizationId, recipient: req.user._id, read: false });
  return sendSuccess(res, 200, { count });
});

/**
 * PUT /api/notifications/:id/read
 * Marks a single notification as read. Only the recipient can do this.
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, organizationId: req.organizationId });

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  if (notification.recipient.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Forbidden: you do not have access to this notification");
  }

  if (!notification.read) {
    notification.read = true;
    await notification.save();
  }

  return sendSuccess(res, 200, notification);
});

/**
 * PUT /api/notifications/read-all
 * Marks every unread notification belonging to the current user as read.
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ organizationId: req.organizationId, recipient: req.user._id, read: false }, { $set: { read: true } });
  return sendSuccess(res, 200, { success: true });
});

module.exports = { listNotifications, getUnreadCount, markAsRead, markAllAsRead };
