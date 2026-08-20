const User = require("../models/User");
const Organization = require("../models/Organization");
const generateToken = require("../utils/generateToken");
const { asyncHandler, sendSuccess } = require("../utils/apiResponse");

const makeAdminCode = () => `TL-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

const ensureAdminOrganization = async (user) => {
  if (user.organizationId) return Organization.findById(user.organizationId);
  if (user.role !== "admin") return null;
  let code;
  do { code = makeAdminCode(); } while (await Organization.exists({ adminCode: code }));
  const organization = await Organization.create({ name: `${user.name}'s Organization`, adminUser: user._id, adminCode: code });
  user.organizationId = organization._id;
  await user.save();
  return organization;
};

const toSafeUser = (user, organization = null) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  organizationId: user.organizationId || null,
  organization: organization ? { id: organization._id, name: organization.name, adminCode: organization.adminCode } : null,
  department: user.department,
  employeeId: user.employeeId || "",
  employeeRole: user.employeeRole || "",
  phone: user.phone || "",
  isActive: user.isActive !== false,
  createdAt: user.createdAt,
  github: user.role === "admin" && organization ? {
    connected: !!organization.github?.providerUserId,
    username: organization.github?.username || "",
    repository: organization.github?.fullName ? {
      owner: organization.github.owner,
      name: organization.github.repoName,
      fullName: organization.github.fullName,
      branch: organization.github.defaultBranch,
      htmlUrl: organization.github.htmlUrl,
    } : null,
    connectedAt: organization.github?.connectedAt || null,
  } : { connected: false, username: "", repository: null, connectedAt: null },
});

const registerAdmin = asyncHandler(async (req, res) => {
  const { organizationName, name, email, password, confirmPassword, phone } = req.body || {};
  if (!organizationName || !name || !email || !password) { res.status(400); throw new Error("Organization name, name, email and password are required"); }
  if (password.length < 6) { res.status(400); throw new Error("Password must be at least 6 characters"); }
  if (confirmPassword !== undefined && confirmPassword !== password) { res.status(400); throw new Error("Passwords do not match"); }
  const normalizedEmail = email.toLowerCase().trim();
  if (await User.findOne({ email: normalizedEmail })) { res.status(400); throw new Error("An account with this email already exists"); }
  const user = await User.create({ name: name.trim(), email: normalizedEmail, password, phone, role: "admin" });
  let code;
  do { code = makeAdminCode(); } while (await Organization.exists({ adminCode: code }));
  const organization = await Organization.create({ name: organizationName.trim(), adminUser: user._id, adminCode: code });
  user.organizationId = organization._id;
  await user.save();
  const token = generateToken(user);
  return sendSuccess(res, 201, { user: toSafeUser(user, organization), token });
});

const register = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, phone, adminCode } = req.body || {};
  if (!name || !email || !password || !adminCode) { res.status(400); throw new Error("Name, email, password and Admin Code are required"); }
  if (!/^\S+@\S+\.\S+$/.test(email)) { res.status(400); throw new Error("Please provide a valid email address"); }
  if (password.length < 6) { res.status(400); throw new Error("Password must be at least 6 characters"); }
  if (confirmPassword !== undefined && confirmPassword !== password) { res.status(400); throw new Error("Passwords do not match"); }
  const organization = await Organization.findOne({ adminCode: adminCode.trim().toUpperCase() });
  if (!organization) { res.status(400); throw new Error("Invalid Admin Code"); }
  const normalizedEmail = email.toLowerCase().trim();
  if (await User.findOne({ email: normalizedEmail })) { res.status(400); throw new Error("An account with this email already exists"); }
  const user = await User.create({ name, email: normalizedEmail, password, phone, role: "client", organizationId: organization._id });
  const token = generateToken(user);
  return sendSuccess(res, 201, { user: toSafeUser(user, organization), token });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400); throw new Error("Email and password are required"); }
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
  if (!user) { res.status(401); throw new Error("Invalid email or password"); }
  if (user.isActive === false) { res.status(403); throw new Error(user.role === "employee" ? "Your employee account is currently inactive. Please contact the administrator." : "This account is inactive. Contact an administrator."); }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) { res.status(401); throw new Error("Invalid email or password"); }
  const organization = await ensureAdminOrganization(user);
  if (user.role !== "superadmin" && !user.organizationId) { res.status(403); throw new Error("This account is not linked to an organization. Please contact an administrator."); }
  const token = generateToken(user);
  return sendSuccess(res, 200, { user: toSafeUser(user, organization || await Organization.findById(user.organizationId)), token });
});

module.exports = { register, registerAdmin, login, toSafeUser, ensureAdminOrganization };
