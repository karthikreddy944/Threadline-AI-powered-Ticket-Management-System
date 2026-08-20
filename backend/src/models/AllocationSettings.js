const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, unique: true, index: true },
  key: { type: String, default: "default" },

  // Admin-selected assignment mode. "manual" = admin picks the employee
  // for every ticket by hand. "automatic" = the backend picks the
  // employee using `strategy` below.
  mode: { type: String, enum: ["manual", "automatic"], default: "manual" },

  strategy: { type: String, enum: ["round_robin", "priority", "fifo"], default: "round_robin" },
  priorityOrder: { type: [String], default: ["Critical", "High", "Medium", "Low"] },

  // Round Robin state. We track the *employee* who received the most
  // recent automatic assignment (rather than a plain numeric index)
  // so rotation stays correct even as employees are added, removed,
  // or deactivated between assignments.
  lastAssignedEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  // Legacy numeric cursor, kept only so older documents/data don't
  // break validation. No longer used by allocationService.
  cursor: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("AllocationSettings", schema);
