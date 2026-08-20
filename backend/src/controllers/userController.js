const User = require("../models/User");
const Ticket = require("../models/Ticket");
const { asyncHandler, sendSuccess } = require("../utils/apiResponse");
const { toSafeUser } = require("./authController");

/**
 * GET /api/users/me
 * Returns the currently authenticated user's profile.
 */
const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, toSafeUser(req.user, req.organization));
});

/**
 * GET /api/users
 * GET /api/users/employees
 * ADMIN ONLY. Used for assigning tickets to staff, and for the Admin >
 * Employees page. Never exposes password fields.
 *
 * When listing employees specifically, each record is annotated with
 * real ticket counts pulled from the Ticket collection (never faked
 * on the frontend).
 */
const getUsers = asyncHandler(async (req, res) => {
  const { role, search = "", department = "", active } = req.query;
  const isEmployeeList = req.path.endsWith("/employees");
  const requestedRole = isEmployeeList ? "employee" : role;

  const filter = { organizationId: req.organizationId };
  if (requestedRole) filter.role = requestedRole;
  if (department) filter.department = department;
  if (active === "true" || active === "false") filter.isActive = active === "true";
  if (search.trim()) {
    const pattern = new RegExp(search.trim(), "i");
    filter.$or = [{ name: pattern }, { email: pattern }, { department: pattern }, { employeeId: pattern }, { employeeRole: pattern }];
  }

  const users = await User.find(filter).select("-password").sort({ createdAt: -1 });

  if (!isEmployeeList || users.length === 0) {
    return sendSuccess(res, 200, users);
  }

  // Real per-employee ticket counts, computed from the database —
  // never hardcoded on the frontend.
  const employeeIds = users.map((u) => u._id);
  const counts = await Ticket.aggregate([
    { $match: { organizationId: req.organizationId, assignedTo: { $in: employeeIds } } },
    {
      $group: {
        _id: "$assignedTo",
        assigned: { $sum: 1 },
        open: { $sum: { $cond: [{ $in: ["$status", ["New", "Assigned", "AI Analysis"]] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $in: ["$status", ["Resolved", "Closed"]] }, 1, 0] } },
      },
    },
  ]);

  const countsByEmployee = new Map(counts.map((c) => [c._id.toString(), c]));

  const withStats = users.map((u) => {
    const stats = countsByEmployee.get(u._id.toString()) || { assigned: 0, open: 0, inProgress: 0, resolved: 0 };
    return {
      ...u.toObject(),
      ticketStats: {
        assigned: stats.assigned,
        open: stats.open,
        inProgress: stats.inProgress,
        resolved: stats.resolved,
      },
    };
  });

  return sendSuccess(res, 200, withStats);
});

/**
 * POST /api/users/employees
 * ADMIN ONLY. Creates an employee account. Employee signup is never
 * public — this is the only way an employee account comes into being
 * (aside from the dev seed script).
 */
const createEmployee = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    department = "IT Support",
    employeeId = "",
    employeeRole = "",
    isActive = true,
  } = req.body || {};

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role: "employee",
    department,
    employeeId,
    employeeRole,
    isActive: !!isActive,
    organizationId: req.organizationId,
  });

  return sendSuccess(res, 201, toSafeUser(user));
});

/**
 * PUT /api/users/employees/:id
 * ADMIN ONLY. Edits an employee's profile, status, or resets their
 * password. Enabling/disabling here is what actually gates login —
 * enforced in authController.login, not just hidden in the UI.
 */
const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await User.findOne({ _id: req.params.id, role: "employee", organizationId: req.organizationId }).select("+password");
  if (!employee) {
    res.status(404);
    throw new Error("Employee not found");
  }

  const { name, email, department, employeeId, employeeRole, isActive, password } = req.body || {};

  if (name !== undefined) employee.name = name;
  if (department !== undefined) employee.department = department;
  if (employeeId !== undefined) employee.employeeId = employeeId;
  if (employeeRole !== undefined) employee.employeeRole = employeeRole;
  if (isActive !== undefined) employee.isActive = !!isActive;

  if (email !== undefined && email.toLowerCase().trim() !== employee.email) {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: employee._id } });
    if (existing) {
      res.status(400);
      throw new Error("An account with this email already exists");
    }
    employee.email = normalizedEmail;
  }

  if (password) {
    if (password.length < 6) {
      res.status(400);
      throw new Error("Password must be at least 6 characters");
    }
    employee.password = password;
  }

  await employee.save();
  return sendSuccess(res, 200, toSafeUser(employee));
});

/**
 * PATCH /api/users/employees/:id/status
 * ADMIN ONLY. Dedicated enable/disable endpoint (Employees page uses
 * this for the Enable/Disable actions instead of a full edit).
 */
const updateEmployeeStatus = asyncHandler(async (req, res) => {
  const employee = await User.findOne({ _id: req.params.id, role: "employee", organizationId: req.organizationId });
  if (!employee) {
    res.status(404);
    throw new Error("Employee not found");
  }

  const { isActive } = req.body || {};
  if (typeof isActive !== "boolean") {
    res.status(400);
    throw new Error("isActive (boolean) is required");
  }

  employee.isActive = isActive;
  await employee.save();
  return sendSuccess(res, 200, toSafeUser(employee));
});

/**
 * DELETE /api/users/employees/:id
 * ADMIN ONLY. Removing an employee unassigns (never deletes) their
 * tickets so nothing is left pointing at a user that no longer exists.
 */
const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await User.findOne({ _id: req.params.id, role: "employee", organizationId: req.organizationId });
  if (!employee) {
    res.status(404);
    throw new Error("Employee not found");
  }

  await Ticket.updateMany(
    { organizationId: req.organizationId, assignedTo: employee._id },
    { $set: { assignedTo: null, assignedAt: null, status: "New" } }
  );

  await User.deleteOne({ _id: employee._id });
  return sendSuccess(res, 200, { deleted: true });
});

module.exports = {
  getMe,
  getUsers,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
};
