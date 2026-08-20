const mongoose = require("mongoose");

const TICKET_STATUSES = ["New", "AI Analysis", "Assigned", "In Progress", "Pending", "Resolved", "Closed"];
const TICKET_PRIORITIES = ["Low", "Medium", "High", "Critical"];
const TICKET_CATEGORIES = ["Network", "Hardware", "Software", "Account/Login", "Other"];

const ticketSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true, required: false },
    ticketId: {
      type: String,
      unique: true,
      // Generated in a pre-validate hook below, e.g. TKT-000123
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: TICKET_CATEGORIES,
      required: [true, "Category is required"],
    },
    priority: {
      type: String,
      enum: TICKET_PRIORITIES,
      required: [true, "Priority is required"],
    },
    status: {
      type: String,
      enum: TICKET_STATUSES,
      default: "New",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedAt: { type: Date, default: null },
    githubRepo: {
      type: {
        provider: { type: String, default: "github" },
        owner: { type: String, required: true },
        name: { type: String, required: true },
        fullName: { type: String, required: true },
        branch: { type: String, required: true },
        htmlUrl: { type: String, default: "" },
      },
      default: null,
    },
    repoAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Existing Day 5 attachment-based Gemini analysis remains supported.
    aiAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Employee -> Admin escalation ("Unable to Resolve"). Represents the
    // CURRENT/active escalation, if any. Cleared (reset to defaults) when
    // an admin reassigns the ticket to a new employee; the cleared state
    // is pushed onto `escalationHistory` first so nothing is lost.
    escalation: {
      escalatedToAdmin: { type: Boolean, default: false },
      escalatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      escalatedAt: { type: Date, default: null },
      escalationReason: { type: String, trim: true, default: "" },
      // Who was assigned to the ticket at the moment it was escalated —
      // preserved even after a reassignment clears the active escalation.
      previousAssignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },
    escalationHistory: {
      type: [
        {
          escalatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          escalatedAt: { type: Date },
          escalationReason: { type: String },
          previousAssignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          resolvedAt: { type: Date },
        },
      ],
      default: [],
    },
    // Uploaded files live on disk (backend/uploads/tickets); this only
    // stores metadata. `filename` is the randomly generated name on
    // disk — never the client-supplied name — so it's also safe to use
    // as a lookup key without any path-traversal risk.
    attachments: {
      type: [
        {
          originalName: { type: String, required: true },
          filename: { type: String, required: true },
          mimeType: { type: String, required: true },
          size: { type: Number, required: true },
          uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// Auto-generate a human-friendly ticketId like TKT-000001
ticketSchema.pre("validate", async function generateTicketId(next) {
  if (this.ticketId) return next();

  try {
    const count = await mongoose.model("Ticket").countDocuments();
    this.ticketId = `TKT-${String(count + 1).padStart(6, "0")}`;
    next();
  } catch (error) {
    next(error);
  }
});

ticketSchema.statics.STATUSES = TICKET_STATUSES;
ticketSchema.statics.PRIORITIES = TICKET_PRIORITIES;
ticketSchema.statics.CATEGORIES = TICKET_CATEGORIES;

module.exports = mongoose.model("Ticket", ticketSchema);
