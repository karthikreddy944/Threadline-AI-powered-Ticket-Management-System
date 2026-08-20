const Notification = require("../models/Notification");
const User = require("../models/User");
const Ticket = require("../models/Ticket");

const createNotification = async ({ organizationId = null, recipient, type, title, message, ticket = null, actor = null }) => {
  if (!recipient) return null;
  if (actor && recipient.toString() === actor.toString()) return null;
  try {
    if (!organizationId && ticket) { const t = await Ticket.findById(ticket).select("organizationId"); organizationId = t?.organizationId || null; }
    return await Notification.create({ organizationId, recipient, type, title, message, ticket, actor });
  } catch (error) { console.error("Failed to create notification:", error.message); return null; }
};

const notifyAdmins = async ({ organizationId = null, type, title, message, ticket = null, actor = null, excludeUserId = null }) => {
  try {
    if (!organizationId && ticket) { const t = await Ticket.findById(ticket).select("organizationId"); organizationId = t?.organizationId || null; }
    const filter = { role: "admin" };
    if (organizationId) filter.organizationId = organizationId;
    const admins = await User.find(filter).select("_id");
    await Promise.all(admins.map(a => createNotification({ organizationId, recipient: a._id, type, title, message, ticket, actor })));
  } catch (error) { console.error("Failed to notify admins:", error.message); }
};
module.exports = { createNotification, notifyAdmins };
