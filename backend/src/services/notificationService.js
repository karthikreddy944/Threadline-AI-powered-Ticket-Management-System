const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * Creates a single notification. Never throws — notification delivery
 * is a side effect of a real event (ticket created, status changed,
 * etc.) and a failure here must never break the primary request.
 * Returns the created document, or null if nothing was created.
 */
const createNotification = async ({ recipient, type, title, message, ticket = null, actor = null }) => {
  if (!recipient) return null;

  // Don't notify a user about their own action (e.g. an admin who
  // assigns a ticket to themselves shouldn't get an "assigned to you"
  // notification).
  if (actor && recipient.toString() === actor.toString()) return null;

  try {
    return await Notification.create({ recipient, type, title, message, ticket, actor });
  } catch (error) {
    console.error("Failed to create notification:", error.message);
    return null;
  }
};

/**
 * Notifies every admin user (optionally excluding one, e.g. the admin
 * who triggered the event). Runs the creates in parallel and never
 * throws.
 */
const notifyAdmins = async ({ type, title, message, ticket = null, actor = null, excludeUserId = null }) => {
  try {
    const admins = await User.find({ role: "admin" }).select("_id");
    const recipients = admins
      .map((a) => a._id)
      .filter((id) => !excludeUserId || id.toString() !== excludeUserId.toString());

    await Promise.all(
      recipients.map((recipient) => createNotification({ recipient, type, title, message, ticket, actor }))
    );
  } catch (error) {
    console.error("Failed to notify admins:", error.message);
  }
};

module.exports = { createNotification, notifyAdmins };
