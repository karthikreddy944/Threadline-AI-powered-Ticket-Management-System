const mongoose = require("mongoose");

// Known notification types. Not enforced as a strict enum so new event
// types can be added later without a migration, but these are the ones
// the app currently generates.
const NOTIFICATION_TYPES = [
  "ticket_created",
  "ticket_assigned",
  "status_changed",
  "comment",
  "attachment_added",
  "repo_analysis_completed",
  "repo_analysis_failed",
  "ticket_escalated",
  "ticket_reassigned",
];

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      default: null,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Powers "my notifications, newest first" and the unread-count query.
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

notificationSchema.statics.TYPES = NOTIFICATION_TYPES;

module.exports = mongoose.model("Notification", notificationSchema);
