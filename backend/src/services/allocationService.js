/**
 * Ticket assignment engine.
 *
 * Supports two admin-selected modes:
 *  - "manual": the admin picks an employee for every ticket by hand
 *    (see ticketController.updateTicket). Nothing in this file runs
 *    automatically in that mode.
 *  - "automatic": the backend picks the employee using one of three
 *    strategies — Round Robin, Priority Wise, or FIFO.
 *
 * The pure selection/ordering functions (chooseRoundRobinIndex,
 * chooseByWorkload, orderTicketsForAssignment) take plain arrays and
 * have no DB dependency, so they can be unit tested in isolation.
 */
const mongoose = require("mongoose");
const User = require("../models/User");
const Ticket = require("../models/Ticket");
const AllocationSettings = require("../models/AllocationSettings");
const { logActivity } = require("./ticketService");
const { createNotification } = require("./notificationService");

const OPEN_STATUSES = ["Assigned", "In Progress", "Pending"];
const PRIORITY_RANK = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const STRATEGY_LABELS = {
  round_robin: "Round Robin",
  priority: "Priority Wise",
  fifo: "FIFO",
};

/* ------------------------------------------------------------------ */
/* Settings                                                           */
/* ------------------------------------------------------------------ */

async function getSettings() {
  return AllocationSettings.findOneAndUpdate(
    { key: "default" },
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function updateSettings({ mode, strategy, priorityOrder }) {
  const update = {};

  if (mode !== undefined) {
    update.mode = ["manual", "automatic"].includes(mode) ? mode : "manual";
  }
  if (strategy !== undefined) {
    update.strategy = ["round_robin", "priority", "fifo"].includes(strategy) ? strategy : "round_robin";
  }
  if (Array.isArray(priorityOrder) && priorityOrder.length) {
    update.priorityOrder = priorityOrder;
  }

  return AllocationSettings.findOneAndUpdate(
    { key: "default" },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

/* ------------------------------------------------------------------ */
/* Employees & workload                                               */
/* ------------------------------------------------------------------ */

/** Only ACTIVE employees are ever eligible for assignment (manual or automatic). */
async function getActiveEmployees() {
  return User.find({ role: "employee", isActive: true }).sort({ createdAt: 1, _id: 1 });
}

/**
 * Real, backend-computed workload per employee — never a frontend
 * counter. Returns a Map keyed by employee id string.
 */
async function getWorkloadMap(employeeIds) {
  if (!employeeIds.length) return new Map();

  const rows = await Ticket.aggregate([
    { $match: { assignedTo: { $in: employeeIds } } },
    {
      $group: {
        _id: "$assignedTo",
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $in: ["$status", OPEN_STATUSES] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $in: ["$status", ["Resolved", "Closed"]] }, 1, 0] } },
      },
    },
  ]);

  const map = new Map();
  rows.forEach((row) => map.set(row._id.toString(), row));
  return map;
}

function openCountFor(employee, workloadMap) {
  return workloadMap.get(employee._id.toString())?.open || 0;
}

/* ------------------------------------------------------------------ */
/* Pure selection logic (no DB access — unit testable)                */
/* ------------------------------------------------------------------ */

/**
 * Round Robin: rotate through ACTIVE employees sequentially, in a
 * stable order (oldest account first). We advance from whoever
 * received the last automatic assignment, so the sequence survives
 * server restarts (state is persisted on AllocationSettings) and
 * self-corrects if an employee has since been removed/deactivated.
 *
 * Returns the index into `employees` to assign next.
 */
function chooseRoundRobinIndex(employees, lastAssignedEmployeeId) {
  if (!employees.length) return -1;
  if (!lastAssignedEmployeeId) return 0;

  const lastIndex = employees.findIndex((e) => e._id.toString() === lastAssignedEmployeeId.toString());
  if (lastIndex === -1) return 0; // last-assigned employee no longer active/eligible
  return (lastIndex + 1) % employees.length;
}

/**
 * Fair, workload-aware selection used for Priority Wise and FIFO.
 * Picks the ACTIVE employee with the fewest open tickets; ties break
 * on whoever was assigned longest ago (or never), then on account
 * age, so the same employee doesn't keep absorbing every ticket.
 */
function chooseByWorkload(employees, workloadMap) {
  if (!employees.length) return -1;

  let bestIndex = 0;
  let best = null;

  employees.forEach((employee, index) => {
    const open = openCountFor(employee, workloadMap);
    const lastAssignedAt = employee.lastAssignedAt ? new Date(employee.lastAssignedAt).getTime() : 0;
    const candidate = { open, lastAssignedAt, index };

    if (
      best === null ||
      candidate.open < best.open ||
      (candidate.open === best.open && candidate.lastAssignedAt < best.lastAssignedAt)
    ) {
      best = candidate;
      bestIndex = index;
    }
  });

  return bestIndex;
}

/**
 * Orders a batch of unassigned tickets for processing by
 * "Automatically Assign Unassigned Tickets", according to strategy:
 *  - fifo: oldest created ticket first (true FIFO, not FILO)
 *  - priority: highest priority first, oldest first within a tier
 *  - round_robin: creation order (rotation itself doesn't depend on order)
 */
function orderTicketsForAssignment(tickets, strategy) {
  const sorted = [...tickets];

  if (strategy === "priority") {
    sorted.sort((a, b) => {
      const rankDiff = (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99);
      if (rankDiff !== 0) return rankDiff;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  } else {
    // fifo and round_robin both process oldest-created tickets first.
    sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  return sorted;
}

/**
 * Chooses the next employee for one ticket, given the current
 * strategy, active employee list, workload snapshot, and (for round
 * robin) who was assigned last. Returns { employee, index } or null.
 */
function selectEmployee({ strategy, employees, workloadMap, lastAssignedEmployeeId }) {
  if (!employees.length) return null;

  const index =
    strategy === "round_robin"
      ? chooseRoundRobinIndex(employees, lastAssignedEmployeeId)
      : chooseByWorkload(employees, workloadMap);

  if (index < 0) return null;
  return { employee: employees[index], index };
}

/* ------------------------------------------------------------------ */
/* DB orchestration                                                   */
/* ------------------------------------------------------------------ */

/**
 * Records an assignment: sets ticket fields, updates the employee's
 * rotation bookkeeping, logs activity, and notifies. `method` is
 * "Manual" or "Automatic" for the audit trail.
 */
async function applyAssignment({ ticket, employee, actorId, method, strategyLabel = null }) {
  const previousAssignee = ticket.assignedTo ? ticket.assignedTo.toString() : null;

  ticket.assignedTo = employee._id;
  ticket.assignedAt = new Date();
  if (ticket.status === "New") ticket.status = "Assigned";

  employee.lastAssignedAt = new Date();

  await Promise.all([ticket.save(), employee.save()]);

  const methodSuffix = method === "Automatic" && strategyLabel ? ` (${strategyLabel})` : "";
  await logActivity({
    ticket: ticket._id,
    actor: actorId,
    action: "assigned",
    message: `${method} assignment: ${employee.name}${methodSuffix}`,
  });

  await createNotification({
    recipient: employee._id,
    type: "ticket_assigned",
    title: `You were assigned ${ticket.ticketId}`,
    message: `You have been assigned to ticket ${ticket.ticketId}.`,
    ticket: ticket._id,
    actor: actorId,
  });

  if (previousAssignee && previousAssignee !== employee._id.toString()) {
    await createNotification({
      recipient: previousAssignee,
      type: "ticket_assigned",
      title: `Ticket ${ticket.ticketId} reassigned`,
      message: `Ticket ${ticket.ticketId} is no longer assigned to you.`,
      ticket: ticket._id,
      actor: actorId,
    });
  }

  return ticket;
}

/**
 * Automatic assignment hook used when a client creates a new ticket.
 * Only runs when Assignment Mode is "automatic" — in "manual" mode
 * new tickets stay unassigned until an admin assigns them by hand.
 * Never throws: assignment is a side effect of ticket creation and
 * must not block it.
 */
async function autoAssignOnCreate(ticket) {
  try {
    const settings = await getSettings();
    if (settings.mode !== "automatic") return null;
    return await runAutomaticAssignment({ ticket, settings, actorId: ticket.createdBy });
  } catch (error) {
    console.error("Automatic assignment on create failed:", error.message);
    return null;
  }
}

/**
 * Shared single-ticket automatic assignment. Assumes `settings.mode`
 * has already been confirmed to be "automatic" by the caller.
 * Returns the assigned employee, or null if there were no eligible
 * active employees.
 */
async function runAutomaticAssignment({ ticket, settings, actorId }) {
  const employees = await getActiveEmployees();
  if (!employees.length) return null;

  const workloadMap = await getWorkloadMap(employees.map((e) => e._id));
  const selection = selectEmployee({
    strategy: settings.strategy,
    employees,
    workloadMap,
    lastAssignedEmployeeId: settings.lastAssignedEmployeeId,
  });
  if (!selection) return null;

  const { employee } = selection;

  if (settings.strategy === "round_robin") {
    settings.lastAssignedEmployeeId = employee._id;
    await settings.save();
  }

  await applyAssignment({
    ticket,
    employee,
    actorId: actorId || employee._id,
    method: "Automatic",
    strategyLabel: STRATEGY_LABELS[settings.strategy],
  });

  return employee;
}

/**
 * POST /api/allocation/assign/:ticketId
 * Admin-triggered automatic assignment for a single ticket.
 * Full validation chain per spec: auth (route middleware) → ticket
 * exists → mode is automatic → eligible active employees exist →
 * ticket not already resolved/assigned (unless explicit reassignment).
 */
async function assignTicketAutomatically({ ticketId, actorId, allowReassign = false }) {
  if (!mongoose.isValidObjectId(ticketId)) {
    return { error: "Invalid ticket id", status: 400 };
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) return { error: "Ticket not found", status: 404 };

  if (ticket.assignedTo && !allowReassign) {
    return { error: "Ticket is already assigned. Use reassignment to change it.", status: 400 };
  }
  if (["Resolved", "Closed"].includes(ticket.status)) {
    return { error: "Ticket is already resolved and cannot be auto-assigned.", status: 400 };
  }

  const settings = await getSettings();
  if (settings.mode !== "automatic") {
    return { error: "Automatic assignment is not enabled. Switch Assignment Mode to Automatic first.", status: 400 };
  }

  const employee = await runAutomaticAssignment({ ticket, settings, actorId });
  if (!employee) {
    return { error: "No active employees available for automatic assignment.", status: 409 };
  }

  const updated = await Ticket.findById(ticket._id)
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email");

  return { ticket: updated, employee };
}

/**
 * POST /api/allocation/assign-all
 * Admin-triggered bulk automatic assignment of every unassigned,
 * unresolved ticket, processed in strategy order (oldest-first for
 * FIFO/Round Robin, priority-first for Priority Wise). Workload is
 * recomputed as the batch runs so distribution stays fair within it.
 */
async function assignAllUnassigned({ actorId }) {
  const settings = await getSettings();
  if (settings.mode !== "automatic") {
    return { error: "Automatic assignment is not enabled. Switch Assignment Mode to Automatic first.", status: 400 };
  }

  const employees = await getActiveEmployees();
  if (!employees.length) {
    return { error: "No active employees available for automatic assignment.", status: 409 };
  }

  const unassignedTickets = await Ticket.find({
    assignedTo: null,
    status: { $nin: ["Resolved", "Closed"] },
  });

  if (!unassignedTickets.length) {
    return { assigned: [], message: "No unassigned tickets to process." };
  }

  const ordered = orderTicketsForAssignment(unassignedTickets, settings.strategy);
  const workloadMap = await getWorkloadMap(employees.map((e) => e._id));
  const assigned = [];

  for (const ticket of ordered) {
    const selection = selectEmployee({
      strategy: settings.strategy,
      employees,
      workloadMap,
      lastAssignedEmployeeId: settings.lastAssignedEmployeeId,
    });
    if (!selection) break; // shouldn't happen, employees is non-empty and static here

    const { employee } = selection;

    if (settings.strategy === "round_robin") {
      settings.lastAssignedEmployeeId = employee._id;
    }

    await applyAssignment({
      ticket,
      employee,
      actorId,
      method: "Automatic",
      strategyLabel: STRATEGY_LABELS[settings.strategy],
    });

    // Keep the in-memory workload snapshot current so the rest of
    // this batch distributes fairly instead of piling onto whoever
    // looked least-loaded at the start.
    const key = employee._id.toString();
    const current = workloadMap.get(key) || { open: 0, total: 0, inProgress: 0, resolved: 0 };
    workloadMap.set(key, { ...current, open: current.open + 1, total: current.total + 1 });
    employee.lastAssignedAt = new Date();

    assigned.push({ ticketId: ticket.ticketId, ticket: ticket._id, employee: { id: employee._id, name: employee.name } });
  }

  if (settings.strategy === "round_robin") {
    await settings.save();
  }

  return { assigned };
}

module.exports = {
  getSettings,
  updateSettings,
  getActiveEmployees,
  getWorkloadMap,
  autoAssignOnCreate,
  assignTicketAutomatically,
  assignAllUnassigned,
  // exported for unit tests
  chooseRoundRobinIndex,
  chooseByWorkload,
  orderTicketsForAssignment,
  selectEmployee,
};
