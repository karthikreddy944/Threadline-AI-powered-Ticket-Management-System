const Organization = require("../models/Organization");
const User = require("../models/User");
const Ticket = require("../models/Ticket");
const Notification = require("../models/Notification");
const TicketActivity = require("../models/TicketActivity");
const AllocationSettings = require("../models/AllocationSettings");

const makeCode = () => `TL-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

async function migrateTenancy() {
  const admins = await User.find({ role: "admin" });
  for (const admin of admins) {
    if (admin.organizationId && await Organization.exists({ _id: admin.organizationId })) continue;
    let code; do { code = makeCode(); } while (await Organization.exists({ adminCode: code }));
    const org = await Organization.create({ name: `${admin.name}'s Organization`, adminUser: admin._id, adminCode: code });
    admin.organizationId = org._id; await admin.save();
  }
  const orgs = await Organization.find({});
  if (orgs.length === 1) {
    // The original single-tenant installation has an unambiguous owner for
    // any user that predates organizations.
    await User.updateMany({ organizationId: null }, { $set: { organizationId: orgs[0]._id } });
  }

  // Backfill only unlinked historical records. In a multi-tenant database
  // the owning user is the sole source of truth: this preserves isolation and
  // lets old tickets remain visible after their owner was linked to an org.
  const linkedUsers = await User.find({ organizationId: { $ne: null } }).select("_id organizationId");
  for (const user of linkedUsers) {
    const organizationId = user.organizationId;
    await Promise.all([
      Ticket.updateMany(
        { organizationId: null, createdBy: user._id },
        { $set: { organizationId } }
      ),
      Notification.updateMany(
        { organizationId: null, recipient: user._id },
        { $set: { organizationId } }
      ),
      TicketActivity.updateMany(
        { organizationId: null, actor: user._id },
        { $set: { organizationId } }
      ),
    ]);
  }
}

module.exports = migrateTenancy;
