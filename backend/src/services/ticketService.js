const Ticket = require("../models/Ticket");
const TicketActivity = require("../models/TicketActivity");

/**
 * Creates a TicketActivity entry. Kept in one place so every part
 * of the app records history the same way.
 */
const logActivity = async ({ ticket, actor, action, message = "", previousStatus = null, newStatus = null }) => {
  return TicketActivity.create({
    ticket,
    actor,
    action,
    message,
    previousStatus,
    newStatus,
  });
};

/**
 * Builds a Mongoose filter object for the "get all tickets" admin
 * endpoint from query params (search, status, priority, category).
 */
const buildTicketFilter = ({ search, status, priority, category }) => {
  const filter = {};

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ title: regex }, { description: regex }, { ticketId: regex }];
  }

  return filter;
};

module.exports = { logActivity, buildTicketFilter };
