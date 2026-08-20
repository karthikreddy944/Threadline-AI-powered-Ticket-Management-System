const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");

const router = express.Router();

// Every notification route requires authentication, and every handler
// scopes its query/update to req.user._id — a client can only ever
// read or modify their own notifications (see notificationController.js).
router.use(protect);

router.get("/", listNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/read-all", markAllAsRead);
router.put("/:id/read", markAsRead);

module.exports = router;
