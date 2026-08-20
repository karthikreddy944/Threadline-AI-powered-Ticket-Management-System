const mongoose = require("mongoose");

const ticketActivitySchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      // e.g. "created", "comment", "status_changed", "assigned", "priority_changed"
      required: true,
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
    previousStatus: {
      type: String,
      default: null,
    },
    newStatus: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

ticketActivitySchema.index({ ticket: 1, createdAt: 1 });

module.exports = mongoose.model("TicketActivity", ticketActivitySchema);
