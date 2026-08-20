/**
 * Seeds the database with one admin and one client test account.
 * Run with: npm run seed
 *
 * These are LOCAL DEVELOPMENT / TESTING credentials only.
 * Do not use these values in any real deployment.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

const TEST_ADMIN = {
  name: "Admin User",
  email: "admin@ticketsystem.test",
  password: "Admin@123",
  role: "admin",
  department: "IT Support",
};

const TEST_EMPLOYEE = {
  name: "Support Employee",
  email: "employee@ticketsystem.test",
  password: "Employee@123",
  role: "employee",
  department: "IT Support",
};

const TEST_CLIENT = {
  name: "Client User",
  email: "client@ticketsystem.test",
  password: "Client@123",
  role: "client",
};

const seed = async () => {
  await connectDB();

  for (const userData of [TEST_ADMIN, TEST_CLIENT, TEST_EMPLOYEE]) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`Skipped (already exists): ${userData.email}`);
      continue;
    }
    await User.create(userData);
    console.log(`Created: ${userData.email} (${userData.role})`);
  }

  console.log("\nSeed complete. Test credentials:");
  console.log(`  Admin  -> email: ${TEST_ADMIN.email}  password: ${TEST_ADMIN.password}`);
  console.log(`  Client -> email: ${TEST_CLIENT.email}  password: ${TEST_CLIENT.password}`);
  console.log(`  Employee -> email: ${TEST_EMPLOYEE.email}  password: ${TEST_EMPLOYEE.password}`);

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
