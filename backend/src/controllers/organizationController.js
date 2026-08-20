const User = require("../models/User");
const Ticket = require("../models/Ticket");
const { asyncHandler, sendSuccess } = require("../utils/apiResponse");

const getOrganization = asyncHandler(async (req, res) => {
  const organization = req.organization;
  return sendSuccess(res, 200, { id: organization._id, name: organization.name, adminCode: organization.adminCode, createdAt: organization.createdAt });
});

const getClients = asyncHandler(async (req, res) => {
  const { search = "" } = req.query;
  const filter = { organizationId: req.organizationId, role: "client" };
  if (search.trim()) {
    const pattern = new RegExp(search.trim(), "i");
    filter.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }];
  }
  const clients = await User.find(filter).select("-password").sort({ createdAt: -1 });
  const ids = clients.map(c => c._id);
  const counts = await Ticket.aggregate([
    { $match: { organizationId: req.organizationId, createdBy: { $in: ids } } },
    // $nin is a query operator, not an aggregation expression. Use
    // $not + $in here so the client list can be calculated by MongoDB.
    { $group: { _id: "$createdBy", total: { $sum: 1 }, open: { $sum: { $cond: [{ $not: [{ $in: ["$status", ["Resolved", "Closed"]] }] }, 1, 0] } } } }
  ]);
  const map = new Map(counts.map(x => [x._id.toString(), x]));
  return sendSuccess(res, 200, clients.map(c => ({ ...c.toObject(), ticketStats: map.get(c._id.toString()) || { total: 0, open: 0 } })));
});

const getClient = asyncHandler(async (req, res) => {
  const client = await User.findOne({ _id: req.params.id, organizationId: req.organizationId, role: "client" }).select("-password");
  if (!client) { res.status(404); throw new Error("Client not found"); }
  const tickets = await Ticket.find({ organizationId: req.organizationId, createdBy: client._id }).populate("assignedTo", "name email").sort({ createdAt: -1 });
  return sendSuccess(res, 200, { client, tickets });
});

module.exports = { getOrganization, getClients, getClient };
