const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Organization = require("../models/Organization");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: "Not authorized, user no longer exists" });
    if (user.isActive === false) return res.status(403).json({ success: false, message: "Account is inactive" });
    if (user.role === "superadmin") {
      req.user = user;
      req.organization = null;
      req.organizationId = null;
      return next();
    }
    if (!user.organizationId) {
      return res.status(403).json({ success: false, message: "Your account is not linked to an organization" });
    }

    const organization = await Organization.findById(user.organizationId);
    if (!organization) {
      return res.status(403).json({ success: false, message: "Your organization no longer exists. Please contact an administrator." });
    }
    if (organization.subscription?.status === "suspended") {
      return res.status(403).json({ success: false, message: "Your organization subscription is suspended. Please contact Platform Operations." });
    }

    req.user = user;
    req.organization = organization;
    req.organizationId = organization._id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Not authorized, invalid or expired token" });
  }
};
module.exports = { protect };
