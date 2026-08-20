const Ticket = require("../models/Ticket");
const TicketActivity = require("../models/TicketActivity");

const logActivity = async ({ ticket, actor, action, message = "", previousStatus = null, newStatus = null, organizationId = null }) => {
  if (!organizationId) { const t = await Ticket.findById(ticket).select("organizationId"); organizationId = t?.organizationId || null; }
  return TicketActivity.create({ organizationId, ticket, actor, action, message, previousStatus, newStatus });
};
const buildTicketFilter = ({ search, status, priority, category }) => {
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (search) { const regex = new RegExp(search, "i"); filter.$or = [{ title: regex }, { description: regex }, { ticketId: regex }]; }
  return filter;
};
module.exports = { logActivity, buildTicketFilter };
