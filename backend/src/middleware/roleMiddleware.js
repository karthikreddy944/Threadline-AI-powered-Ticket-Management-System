/**
 * Restricts a route to specific roles.
 * Usage: router.get("/", protect, requireRole("admin"), handler)
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no authenticated user",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: you do not have permission to perform this action",
      });
    }

    next();
  };
};

module.exports = { requireRole };
