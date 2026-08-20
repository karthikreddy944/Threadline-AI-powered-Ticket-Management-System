const Organization = require("../models/Organization");

const requireOrganization = async (req, res, next) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(403).json({ success: false, message: "Your account is not linked to an organization" });
    }
    const organization = await Organization.findById(req.user.organizationId);
    if (!organization) {
      return res.status(403).json({ success: false, message: "Organization not found" });
    }
    req.organization = organization;
    req.organizationId = organization._id;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireOrganization };
