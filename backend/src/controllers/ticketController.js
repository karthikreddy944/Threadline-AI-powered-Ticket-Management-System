const mongoose = require("mongoose");
const Ticket = require("../models/Ticket");
const TicketActivity = require("../models/TicketActivity");
const { asyncHandler, sendSuccess } = require("../utils/apiResponse");
const { logActivity, buildTicketFilter } = require("../services/ticketService");
const { notifyAdmins, createNotification } = require("../services/notificationService");
const { autoAssignOnCreate } = require("../services/allocationService");
const User = require("../models/User");

/**
 * POST /api/tickets
 * Client creates a ticket. createdBy always comes from the
 * authenticated user, never from the request body.
 */
const createTicket = asyncHandler(async (req, res) => {
  const { title, description, category, priority } = req.body;

  if (!title || !description || !category || !priority) {
    res.status(400);
    throw new Error("title, description, category and priority are required");
  }

  const ticket = await Ticket.create({
    organizationId: req.organizationId,
    title,
    description,
    category,
    priority,
    status: "New",
    createdBy: req.user._id,
    githubRepo: req.organization?.github?.fullName ? {
      provider: "github",
      owner: req.organization.github.owner,
      name: req.organization.github.repoName,
      fullName: req.organization.github.fullName,
      branch: req.organization.github.defaultBranch || "main",
      htmlUrl: req.organization.github.htmlUrl || "",
    } : null,
    aiAnalysis: null,
    repoAnalysis: null,
  });

  await logActivity({
    ticket: ticket._id,
    actor: req.user._id,
    action: "created",
    message: "Ticket created",
    newStatus: "New",
  });

  await notifyAdmins({
    type: "ticket_created",
    title: `New ticket ${ticket.ticketId}`,
    message: `New ticket ${ticket.ticketId} created by ${req.user.name}.`,
    ticket: ticket._id,
    actor: req.user._id,
  });

  // Only assigns when Assignment Mode is "automatic" (see allocationService).
  // In "manual" mode the ticket stays unassigned until an admin picks
  // an employee. Mutates `ticket` in place and handles its own
  // activity log + notification, so nothing further is needed here.
  await autoAssignOnCreate(ticket);

  const populated = await Ticket.findById(ticket._id).populate("createdBy","name email").populate("assignedTo","name email");
  return sendSuccess(res, 201, populated);
});

/**
 * GET /api/tickets/my
 * Returns tickets created by the logged-in client.
 */
const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ organizationId: req.organizationId, createdBy: req.user._id }).sort({ createdAt: -1 });
  return sendSuccess(res, 200, tickets);
});

/**
 * GET /api/tickets/:id
 * Accessible if the requester created the ticket, or is an admin.
 */
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({ _id: req.params.id, organizationId: req.organizationId })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email");

  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  const isOwner = ticket.createdBy._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  const isAssignee = req.user.role === "employee" && ticket.assignedTo?._id?.toString() === req.user._id.toString();

  if (!isOwner && !isAdmin && !isAssignee) {
    res.status(403);
    throw new Error("Forbidden: you do not have access to this ticket");
  }

  // Staff investigations always use the organization's current admin-connected
  // repository. This also lets tickets created before a repository was linked
  // show the correct repository and analysis controls.
  if ((isAdmin || isAssignee) && req.organization?.github?.fullName) {
    ticket.githubRepo = {
      provider: "github",
      owner: req.organization.github.owner,
      name: req.organization.github.repoName,
      fullName: req.organization.github.fullName,
      branch: req.organization.github.defaultBranch || "main",
      htmlUrl: req.organization.github.htmlUrl || "",
    };
  }

  return sendSuccess(res, 200, ticket);
});

/**
 * GET /api/tickets
 * ADMIN ONLY. Supports search, status/priority/category filters,
 * and simple pagination via ?page=&limit=
 */
const getAllTickets = asyncHandler(async (req, res) => {
  const { search, status, priority, category, page = 1, limit = 20 } = req.query;

  const filter = { organizationId: req.organizationId, ...buildTicketFilter({ search, status, priority, category }) };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Ticket.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, {
    tickets,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});


const getAssignedTickets = asyncHandler(async (req,res)=>{
  const { status, priority, category, search } = req.query;
  const filter = { organizationId: req.organizationId, assignedTo: req.user._id };
  if(status) filter.status=status; if(priority) filter.priority=priority; if(category) filter.category=category;
  if(search) filter.$or=[{title:new RegExp(search,"i")},{ticketId:new RegExp(search,"i")},{description:new RegExp(search,"i")}];
  const tickets=await Ticket.find(filter).populate("createdBy","name email").populate("assignedTo","name email").sort({updatedAt:-1});
  return sendSuccess(res,200,tickets);
});

const getEmployeeStats = asyncHandler(async(req,res)=>{
 const [total,active,resolved,pending,critical,escalated]=await Promise.all([
  Ticket.countDocuments({organizationId:req.organizationId,assignedTo:req.user._id}),
  Ticket.countDocuments({organizationId:req.organizationId,assignedTo:req.user._id,status:{ $in:["Assigned","In Progress"] }}),
  Ticket.countDocuments({organizationId:req.organizationId,assignedTo:req.user._id,status:{ $in:["Resolved","Closed"] }}),
  Ticket.countDocuments({organizationId:req.organizationId,assignedTo:req.user._id,status:"Pending"}),
  Ticket.countDocuments({organizationId:req.organizationId,assignedTo:req.user._id,priority:"Critical",status:{ $nin:["Resolved","Closed"] }}),
  // Escalated is measured from the activity log (not the live assignedTo
  // field) so it still reflects this employee's own escalations even
  // after an admin reassigns the ticket to someone else.
  TicketActivity.countDocuments({organizationId:req.organizationId, actor:req.user._id, action:"escalated"})
 ]); return sendSuccess(res,200,{total,active,resolved,pending,critical,escalated});
});

/**
 * POST /api/tickets/:id/escalate
 * EMPLOYEE ONLY. "Unable to Resolve" — the employee escalates a ticket
 * that is assigned to them back to Admin for help/reassignment.
 *
 * Security: the employee is taken from the authenticated JWT/session
 * (req.user), never from the request body. The ticket's current
 * assignedTo (read from the database) must match req.user._id, or the
 * request is rejected with 403 — this is what stops Employee A from
 * escalating Employee B's ticket.
 */
const escalateTicket = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    res.status(400);
    throw new Error("A reason is required to escalate this ticket.");
  }

  const ticket = await Ticket.findOne({ _id: req.params.id, organizationId: req.organizationId });
  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  if (!ticket.assignedTo || ticket.assignedTo.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Forbidden: you can only escalate a ticket that is assigned to you");
  }

  if (ticket.escalation?.escalatedToAdmin) {
    res.status(400);
    throw new Error("This ticket has already been escalated to Admin.");
  }

  ticket.escalation = {
    escalatedToAdmin: true,
    escalatedBy: req.user._id,
    escalatedAt: new Date(),
    escalationReason: reason.trim(),
    previousAssignee: ticket.assignedTo,
  };
  // The employee's historical assignment is intentionally preserved —
  // assignedTo is NOT cleared here, so it remains visible who was
  // handling the ticket right up until it was escalated.

  await ticket.save();

  await logActivity({
    ticket: ticket._id,
    actor: req.user._id,
    action: "escalated",
    message: reason.trim(),
  });

  await notifyAdmins({
    type: "ticket_escalated",
    title: `Ticket ${ticket.ticketId} escalated`,
    message: `Ticket ${ticket.ticketId} has been escalated by ${req.user.name}: "${reason.trim()}"`,
    ticket: ticket._id,
    actor: req.user._id,
  });

  const updated = await Ticket.findById(ticket._id)
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .populate("escalation.escalatedBy", "name email");

  return sendSuccess(res, 200, updated);
});

// Fields an admin is allowed to change via PUT /api/tickets/:id
const ALLOWED_UPDATE_FIELDS = ["status", "priority", "category", "assignedTo"];

/**
 * PUT /api/tickets/:id
 * ADMIN ONLY. Only whitelisted fields can be changed; anything
 * else in the request body is ignored.
 */
const updateTicket = asyncHandler(async (req, res) => {
  if (!["admin","employee"].includes(req.user.role)) { res.status(403); throw new Error("Forbidden"); }
  const ticket = await Ticket.findOne({ _id: req.params.id, organizationId: req.organizationId });

  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }
  const isEmployee = req.user.role === "employee";
  const isAssignedEmployee = isEmployee && ticket.assignedTo?.toString() === req.user._id.toString();
  if (isEmployee && !isAssignedEmployee) { res.status(403); throw new Error("Only the assigned employee can update this ticket"); }
  if (isEmployee && Object.keys(req.body).some(k => !["status"].includes(k))) { res.status(403); throw new Error("Employees can only change ticket status"); }

  const previousStatus = ticket.status;
  const previousAssignee = ticket.assignedTo ? ticket.assignedTo.toString() : null;
  const changes = [];

  // Validate and normalize assignment before changing the ticket.
  // Only an active employee can be *newly* assigned to a ticket.
  // If assignedTo is being sent unchanged (e.g. the admin only edited
  // status and the form still submits the current assignee), skip
  // re-validation — otherwise a ticket assigned to someone who was
  // later deactivated would become impossible to save at all.
  let nextAssignee = undefined;
  let nextAssigneeEmployee = null;
  if (req.body.assignedTo !== undefined) {
    if (req.body.assignedTo === null || req.body.assignedTo === "") {
      nextAssignee = null;
    } else if (req.body.assignedTo === previousAssignee) {
      // Unchanged — keep the existing assignee as-is, active or not.
      nextAssignee = ticket.assignedTo;
    } else {
      if (!mongoose.isValidObjectId(req.body.assignedTo)) {
        res.status(400);
        throw new Error("Invalid employee id");
      }
      const employee = await User.findOne({
        organizationId: req.organizationId,
        _id: req.body.assignedTo,
        role: "employee",
        isActive: true,
      });
      if (!employee) {
        res.status(400);
        throw new Error("Selected employee does not exist or is inactive");
      }
      nextAssignee = employee._id;
      nextAssigneeEmployee = employee;
    }
  }

  ALLOWED_UPDATE_FIELDS.forEach((field) => {
    if (req.body[field] === undefined) return;

    const incoming = field === "assignedTo"
      ? (nextAssignee ? nextAssignee.toString() : null)
      : req.body[field];
    const currentValue = ticket[field]?.toString?.() ?? ticket[field];
    if (incoming === currentValue) return; // no actual change

    changes.push(field);
    ticket[field] = field === "assignedTo" ? nextAssignee : req.body[field];
    if (field === "assignedTo") {
      ticket.assignedAt = nextAssignee ? new Date() : null;
      if (nextAssignee && ticket.status === "New") ticket.status = "Assigned";
      if (!nextAssignee && ticket.status === "Assigned") ticket.status = "New";
      // lastAssignedAt is updated once below, outside the forEach callback.
      // This keeps the update logic synchronous and avoids partially applied changes.
      if (nextAssigneeEmployee) nextAssigneeEmployee.lastAssignedAt = new Date();
    }
  });

  // Reassigning an escalated ticket resolves the active escalation.
  // The escalation isn't discarded — it's archived onto
  // escalationHistory first so the record of who escalated it, when,
  // and why is preserved even though the live `escalation` flag clears.
  let resolvedEscalation = false;
  if (changes.includes("assignedTo") && ticket.escalation?.escalatedToAdmin) {
    ticket.escalationHistory = ticket.escalationHistory || [];
    ticket.escalationHistory.push({
      escalatedBy: ticket.escalation.escalatedBy,
      escalatedAt: ticket.escalation.escalatedAt,
      escalationReason: ticket.escalation.escalationReason,
      previousAssignee: ticket.escalation.previousAssignee || previousAssignee,
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
    });
    ticket.escalation = {
      escalatedToAdmin: false,
      escalatedBy: null,
      escalatedAt: null,
      escalationReason: "",
      previousAssignee: null,
    };
    resolvedEscalation = true;
  }

  await ticket.save();
  if (nextAssigneeEmployee) await nextAssigneeEmployee.save();

  if (resolvedEscalation) {
    await logActivity({
      ticket: ticket._id,
      actor: req.user._id,
      action: "escalation_resolved",
      message: "Escalation resolved by reassignment",
    });
  }

  // Record status change specifically, since the frontend timeline cares about it
  if (changes.includes("status") && previousStatus !== ticket.status) {
    await logActivity({
      ticket: ticket._id,
      actor: req.user._id,
      action: "status_changed",
      message: `Status changed from ${previousStatus} to ${ticket.status}`,
      previousStatus,
      newStatus: ticket.status,
    });
  }

  // Record any other field changes as a generic update entry
  const otherChanges = changes.filter((f) => f !== "status");
  if (otherChanges.length > 0) {
    await logActivity({
      ticket: ticket._id,
      actor: req.user._id,
      action: "updated",
      message: `Updated: ${otherChanges.join(", ")}`,
    });
  }

  const updated = await Ticket.findById(ticket._id)
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email");

  // Assignment is a real persisted event. Notify the client, the new employee,
  // and (when applicable) the previous employee. Notification failures are
  // isolated by notificationService and cannot roll back the ticket update.
  if (changes.includes("assignedTo")) {
    if (updated.assignedTo) {
      await createNotification({
        recipient: updated.createdBy._id,
        type: "ticket_assigned",
        title: `Ticket ${updated.ticketId} assigned`,
        message: `Your ticket ${updated.ticketId} has been assigned to ${updated.assignedTo.name}.`,
        ticket: updated._id,
        actor: req.user._id,
      });

      await createNotification({
        recipient: updated.assignedTo._id,
        type: "ticket_assigned",
        title: `You were assigned ${updated.ticketId}`,
        message: `You have been assigned to ticket ${updated.ticketId}.`,
        ticket: updated._id,
        actor: req.user._id,
      });

      await logActivity({
        ticket: updated._id,
        actor: req.user._id,
        action: "assigned",
        message: `Manual assignment: ${updated.assignedTo.name}`,
      });
    }

    if (previousAssignee && previousAssignee !== updated.assignedTo?._id?.toString()) {
      await createNotification({
        recipient: previousAssignee,
        type: "ticket_assigned",
        title: `Ticket ${updated.ticketId} reassigned`,
        message: `Ticket ${updated.ticketId} is no longer assigned to you.`,
        ticket: updated._id,
        actor: req.user._id,
      });
    }
  }

  // Notify the client whenever the ticket status changes.
  if (changes.includes("status") && previousStatus !== updated.status) {
    const statusMessage = updated.status === "In Progress"
      ? `Your ticket ${updated.ticketId} is now In Progress.`
      : updated.status === "Resolved"
      ? `Your ticket ${updated.ticketId} has been resolved.`
      : `Your ticket ${updated.ticketId} status changed to ${updated.status}.`;
    await createNotification({ recipient: updated.createdBy._id, type: "status_changed", title: `Ticket ${updated.ticketId} — ${updated.status}`, message: statusMessage, ticket: updated._id, actor: req.user._id });
    if (req.user.role === "employee") {
      await notifyAdmins({ type: "status_changed", title: `${updated.ticketId} moved to ${updated.status}`, message: `${req.user.name} changed ${updated.ticketId} to ${updated.status}.`, ticket: updated._id, actor: req.user._id });
    }
  }

  return sendSuccess(res, 200, updated);
});

/**
 * POST /api/tickets/:id/activity
 * Adds a comment/activity entry. Ticket owner or admin only.
 */
const addTicketActivity = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    res.status(400);
    throw new Error("message is required");
  }

  const ticket = await Ticket.findOne({ _id: req.params.id, organizationId: req.organizationId });
  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  const isOwner = ticket.createdBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  const isAssignee = req.user.role === "employee" && ticket.assignedTo?.toString() === req.user._id.toString();

  if (!isOwner && !isAdmin && !isAssignee) {
    res.status(403);
    throw new Error("Forbidden: you do not have access to this ticket");
  }

  const activity = await logActivity({
    ticket: ticket._id,
    actor: req.user._id,
    action: "comment",
    message: message.trim(),
  });

  if (req.user.role === "admin" || req.user.role === "employee") {
    // Staff replied — notify the client who owns the ticket.
    await createNotification({
      recipient: ticket.createdBy,
      type: "comment",
      title: `New reply on ${ticket.ticketId}`,
      message: `${req.user.name} replied to ticket ${ticket.ticketId}.`,
      ticket: ticket._id,
      actor: req.user._id,
    });
  } else {
    // Client replied — notify the admins.
    await notifyAdmins({
      type: "comment",
      title: `New reply on ${ticket.ticketId}`,
      message: `${req.user.name} replied to ${ticket.ticketId}.`,
      ticket: ticket._id,
      actor: req.user._id,
    });
  }

  return sendSuccess(res, 201, activity);
});

/**
 * GET /api/tickets/:id/activity
 * Returns the activity/history timeline for a ticket.
 * (Not explicitly required, but needed for the frontend timeline to work.)
 */
const getTicketActivity = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({ _id: req.params.id, organizationId: req.organizationId });
  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  const isOwner = ticket.createdBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  const isAssignee = req.user.role === "employee" && ticket.assignedTo?.toString() === req.user._id.toString();

  if (!isOwner && !isAdmin && !isAssignee) {
    res.status(403);
    throw new Error("Forbidden: you do not have access to this ticket");
  }

  const activity = await TicketActivity.find({ organizationId: req.organizationId, ticket: ticket._id })
    .populate("actor", "name email role")
    .sort({ createdAt: 1 });

  return sendSuccess(res, 200, activity);
});


/**
 * GET /api/tickets/analytics
 * ADMIN ONLY. Returns analytics calculated from the real MongoDB data.
 * The default window is the last 7 days; an optional `days` query can be
 * 7, 30, or 90. No mock/static ticket data is used here.
 */
const getTicketAnalytics = asyncHandler(async (req, res) => {
  const allowedDays = [7, 30, 90];
  const requestedDays = parseInt(req.query.days, 10) || 7;
  const days = allowedDays.includes(requestedDays) ? requestedDays : 7;
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const periodFilter = { organizationId: req.organizationId, createdAt: { $gte: since, $lte: now } };

  const [
    total,
    resolved,
    open,
    statusCounts,
    categoryCounts,
    priorityCounts,
    dailyCounts,
    employeeLoad,
    firstResponseRows,
  ] = await Promise.all([
    Ticket.countDocuments(periodFilter),
    Ticket.countDocuments({ ...periodFilter, status: { $in: ["Resolved", "Closed"] } }),
    Ticket.countDocuments({ ...periodFilter, status: { $nin: ["Resolved", "Closed"] } }),
    Ticket.aggregate([
      { $match: periodFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Ticket.aggregate([
      { $match: periodFilter },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Ticket.aggregate([
      { $match: periodFilter },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Ticket.aggregate([
      { $match: periodFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Ticket.aggregate([
      { $match: { organizationId: req.organizationId, assignedTo: { $ne: null } } },
      {
        $group: {
          _id: "$assignedTo",
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $not: [{ $in: ["$status", ["Resolved", "Closed"]] }] }, 1, 0],
            },
          },
          resolved: {
            $sum: {
              $cond: [{ $in: ["$status", ["Resolved", "Closed"]] }, 1, 0],
            },
          },
        },
      },
      { $sort: { active: -1, total: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      { $match: { "employee.role": "employee" } },
      {
        $project: {
          _id: 0,
          id: "$employee._id",
          name: "$employee.name",
          email: "$employee.email",
          total: 1,
          active: 1,
          resolved: 1,
        },
      },
    ]),
    // First response = first staff comment on a ticket created in the window.
    // This is measured from the ticket's createdAt to the first comment made
    // by an admin/employee in TicketActivity.
    Ticket.aggregate([
      { $match: periodFilter },
      {
        $lookup: {
          from: "ticketactivities",
          let: { ticketId: "$_id", created: "$createdAt" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$ticket", "$$ticketId"] },
                    { $gt: ["$createdAt", "$$created"] },
                  ],
                },
                action: "comment",
              },
            },
            { $sort: { createdAt: 1 } },
            { $limit: 1 },
            {
              $lookup: {
                from: "users",
                localField: "actor",
                foreignField: "_id",
                as: "actorUser",
              },
            },
            { $unwind: "$actorUser" },
            { $match: { "actorUser.role": { $in: ["admin", "employee"] } } },
            { $project: { createdAt: 1 } },
          ],
          as: "firstResponse",
        },
      },
      { $unwind: "$firstResponse" },
      {
        $project: {
          responseMinutes: {
            $divide: [
              { $subtract: ["$firstResponse.createdAt", "$createdAt"] },
              60000,
            ],
          },
        },
      },
    ]),
  ]);

  const toMap = (rows) => rows.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  const status = toMap(statusCounts);
  const categories = toMap(categoryCounts);
  const priorities = toMap(priorityCounts);
  const responseMinutes = firstResponseRows.map((row) => row.responseMinutes).filter(Number.isFinite);
  const averageFirstResponseMinutes = responseMinutes.length
    ? Math.round(responseMinutes.reduce((sum, value) => sum + value, 0) / responseMinutes.length)
    : null;

  // Escalation analytics — calculated from real data only.
  // "Trend" reuses the same per-day bucketing as the ticket-volume chart,
  // but counted from TicketActivity "escalated" entries within the window.
  const [escalationTotal, escalationByEmployee, escalationByPriority, escalationTrend] = await Promise.all([
    TicketActivity.countDocuments({ organizationId: req.organizationId, action: "escalated", createdAt: { $gte: since, $lte: now } }),
    TicketActivity.aggregate([
      { $match: { organizationId: req.organizationId, action: "escalated", createdAt: { $gte: since, $lte: now } } },
      { $group: { _id: "$actor", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "employee" } },
      { $unwind: "$employee" },
      { $project: { _id: 0, id: "$employee._id", name: "$employee.name", email: "$employee.email", count: 1 } },
    ]),
    Ticket.aggregate([
      { $match: { organizationId: req.organizationId, "escalation.escalatedToAdmin": true } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]),
    TicketActivity.aggregate([
      { $match: { organizationId: req.organizationId, action: "escalated", createdAt: { $gte: since, $lte: now } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return sendSuccess(res, 200, {
    period: { days, from: since, to: now },
    summary: {
      total,
      resolved,
      open,
      resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
      averageFirstResponseMinutes,
      respondedTickets: responseMinutes.length,
      highPriority: (priorities.High || 0) + (priorities.Critical || 0),
    },
    status,
    categories,
    priorities,
    daily: dailyCounts.map((row) => ({ date: row._id, count: row.count })),
    employeeLoad,
    escalations: {
      total: escalationTotal,
      byEmployee: escalationByEmployee,
      byPriority: toMap(escalationByPriority),
      trend: escalationTrend.map((row) => ({ date: row._id, count: row.count })),
    },
  });
});

/**
 * GET /api/tickets/stats
 * ADMIN ONLY. Powers the Admin Dashboard summary cards.
 */
const getTicketStats = asyncHandler(async (req, res) => {
  const [total, statusCounts, highPriority, unassigned, escalated] = await Promise.all([
    Ticket.countDocuments({ organizationId: req.organizationId }),
    Ticket.aggregate([{ $match: { organizationId: req.organizationId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Ticket.countDocuments({ organizationId: req.organizationId, priority: { $in: ["High", "Critical"] } }),
    Ticket.countDocuments({ organizationId: req.organizationId, assignedTo: null }),
    Ticket.countDocuments({ organizationId: req.organizationId, "escalation.escalatedToAdmin": true }),
  ]);

  const statusMap = statusCounts.reduce((acc, cur) => {
    acc[cur._id] = cur.count;
    return acc;
  }, {});

  return sendSuccess(res, 200, {
    total,
    new: statusMap["New"] || 0,
    aiAnalysis: statusMap["AI Analysis"] || 0,
    assigned: statusMap["Assigned"] || 0,
    inProgress: statusMap["In Progress"] || 0,
    resolved: statusMap["Resolved"] || 0,
    highPriority,
    unassigned,
    escalated,
  });
});

/**
 * GET /api/tickets/escalated
 * ADMIN ONLY. Returns every ticket with an active escalation, newest first.
 * Powers the "Escalated Tickets" card on the Admin Dashboard.
 */
const getEscalatedTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ organizationId: req.organizationId, "escalation.escalatedToAdmin": true })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .populate("escalation.escalatedBy", "name email")
    .sort({ "escalation.escalatedAt": -1 });

  return sendSuccess(res, 200, tickets);
});

module.exports = {
  getAssignedTickets,
  getEmployeeStats,
  createTicket,
  getMyTickets,
  getTicketById,
  getAllTickets,
  updateTicket,
  addTicketActivity,
  getTicketActivity,
  getTicketStats,
  getTicketAnalytics,
  escalateTicket,
  getEscalatedTickets,
};
