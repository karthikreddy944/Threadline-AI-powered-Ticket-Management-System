const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { asyncHandler, sendSuccess } = require("../utils/apiResponse");

// Strips sensitive/internal fields before sending a user back to the client
const toSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  employeeId: user.employeeId || "",
  employeeRole: user.employeeRole || "",
  phone: user.phone || "",
  isActive: user.isActive !== false,
  createdAt: user.createdAt,
  github: user.github ? {
    connected: !!user.github.providerUserId,
    username: user.github.username || "",
    repository: user.github.fullName ? {
      owner: user.github.owner,
      name: user.github.repoName,
      fullName: user.github.fullName,
      branch: user.github.defaultBranch,
      htmlUrl: user.github.htmlUrl,
    } : null,
    connectedAt: user.github.connectedAt || null,
  } : { connected: false, username: "", repository: null, connectedAt: null },
});

/**
 * POST /api/auth/register
 * Registers a new client account. (Admins are created via the seed
 * script, not through the public registration endpoint.)
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, department, phone } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400);
    throw new Error("Please provide a valid email address");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  // Confirm-password check is enforced here too (not just in the UI) so the
  // rule can never be bypassed by calling the API directly.
  if (confirmPassword !== undefined && confirmPassword !== password) {
    res.status(400);
    throw new Error("Passwords do not match");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    department,
    phone,
    role: "client", // public registration can never create admins
  });

  const token = generateToken(user);

  return sendSuccess(res, 201, {
    user: toSafeUser(user),
    token,
  });
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (user.isActive === false) {
    res.status(403);
    throw new Error(
      user.role === "employee"
        ? "Your employee account is currently inactive. Please contact the administrator."
        : "This account is inactive. Contact an administrator."
    );
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user);

  return sendSuccess(res, 200, {
    user: toSafeUser(user),
    token,
  });
});

module.exports = { register, login, toSafeUser };
