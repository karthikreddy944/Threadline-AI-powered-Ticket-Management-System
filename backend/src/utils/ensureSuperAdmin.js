const User = require("../models/User");

async function ensureSuperAdmin() {
  const existing = await User.findOne({ role: "superadmin" });
  if (existing) return existing;
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME?.trim() || "Platform Operations";
  if (!email || !password) {
    console.warn("Super admin not created: set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in backend/.env.");
    return null;
  }
  if (password.length < 12) throw new Error("SUPER_ADMIN_PASSWORD must be at least 12 characters.");
  if (await User.findOne({ email })) throw new Error("SUPER_ADMIN_EMAIL is already used by another account.");
  return User.create({ name, email, password, role: "superadmin", isActive: true });
}

module.exports = ensureSuperAdmin;
