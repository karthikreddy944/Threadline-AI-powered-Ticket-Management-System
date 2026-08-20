require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Organization = require("../models/Organization");

const TEST_ADMIN = { name: "Admin User", email: "admin@ticketsystem.test", password: "Admin@123", role: "admin", department: "IT Support" };
const TEST_EMPLOYEE = { name: "Support Employee", email: "employee@ticketsystem.test", password: "Employee@123", role: "employee", department: "IT Support" };
const TEST_CLIENT = { name: "Client User", email: "client@ticketsystem.test", password: "Client@123", role: "client" };
const code = () => `TL-DEV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const seed = async () => {
  await connectDB();
  let admin = await User.findOne({ email: TEST_ADMIN.email });
  if (!admin) admin = await User.create(TEST_ADMIN);
  let organization = admin.organizationId ? await Organization.findById(admin.organizationId) : null;
  if (!organization) { organization = await Organization.create({ name: "Threadline Demo Organization", adminUser: admin._id, adminCode: code() }); admin.organizationId = organization._id; await admin.save(); }
  for (const userData of [TEST_CLIENT, TEST_EMPLOYEE]) {
    let user = await User.findOne({ email: userData.email });
    if (!user) user = await User.create({ ...userData, organizationId: organization._id });
    else if (!user.organizationId) { user.organizationId = organization._id; await user.save(); }
  }
  console.log("Seed complete.");
  console.log(`Admin: ${TEST_ADMIN.email} / ${TEST_ADMIN.password}`);
  console.log(`Client: ${TEST_CLIENT.email} / ${TEST_CLIENT.password}`);
  console.log(`Employee: ${TEST_EMPLOYEE.email} / ${TEST_EMPLOYEE.password}`);
  console.log(`Admin Code: ${organization.adminCode}`);
  await mongoose.connection.close(); process.exit(0);
};
seed().catch(err => { console.error("Seed failed:", err.message); process.exit(1); });
