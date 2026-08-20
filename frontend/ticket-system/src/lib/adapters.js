/**
 * The existing UI components (TicketRow, TicketTable, WorkflowStrip, etc.)
 * were built against the mock data shape in src/data/mockTickets.js.
 * These adapters reshape real API responses into that same shape so the
 * components don't need to change at all.
 */

import { formatFileSize } from "./attachments";

export function adaptAttachment(attachment) {
  return {
    id: attachment._id || attachment.id,
    name: attachment.originalName,
    size: formatFileSize(attachment.size),
    mimeType: attachment.mimeType,
    isImage: !!attachment.isImage,
    uploadedAt: attachment.uploadedAt,
  };
}

// Ticket documents from list endpoints (getMyTickets) are not populated,
// so createdBy/assignedTo may be a bare ObjectId string rather than
// { _id, name, email }. Handle both.
const nameOf = (userOrId, fallback = null) => {
  if (!userOrId) return fallback;
  if (typeof userOrId === "object") return userOrId.name || fallback;
  return fallback; // just an ObjectId string, no name available
};

export function adaptTicket(ticket, { requesterFallback = null } = {}) {
  if (!ticket) return ticket;
  return {
    ...ticket,
    id: ticket.ticketId || ticket._id, // human-friendly code shown in the UI, e.g. "TKT-000001"
    routeId: ticket._id, // the real Mongo _id — required by GET/PUT /api/tickets/:id
    created: ticket.createdAt,
    updated: ticket.updatedAt,
    requester: nameOf(ticket.createdBy, requesterFallback),
    assignedTo: nameOf(ticket.assignedTo, null),
    assignedToEmail: typeof ticket.assignedTo === "object" ? ticket.assignedTo?.email || null : null,
    assignedToId: typeof ticket.assignedTo === "object" ? ticket.assignedTo?._id : ticket.assignedTo || null,
    attachments: (ticket.attachments || []).map(adaptAttachment),
    // aiAnalysis is intentionally null until the Day 4 LLM integration.
    aiAnalysis: ticket.aiAnalysis || null,
    githubRepo: ticket.githubRepo || null,
    repoAnalysis: ticket.repoAnalysis || null,
    escalation: ticket.escalation?.escalatedToAdmin
      ? {
          escalatedToAdmin: true,
          escalatedByName: nameOf(ticket.escalation.escalatedBy, null),
          escalatedAt: ticket.escalation.escalatedAt,
          reason: ticket.escalation.escalationReason || "",
        }
      : null,
  };
}

const ACTIVITY_TYPE_BY_ACTION = {
  created: "created",
  status_changed: "status",
  assigned: "assigned",
  comment: "comment",
  updated: "comment",
  ai_analysis_completed: "ai",
  escalated: "escalated",
  escalation_resolved: "assigned",
};

export function adaptActivity(entry) {
  return {
    type: ACTIVITY_TYPE_BY_ACTION[entry.action] || "comment",
    actor: entry.actor?.name || "System",
    at: entry.createdAt,
    text: entry.message,
  };
}

// Notifications come back with `ticket` and `actor` populated (or null,
// e.g. once a ticket is deleted). This reshapes them into what the
// Notifications pages and the sidebar badge need.
export function adaptNotification(notification) {
  return {
    id: notification._id || notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: !!notification.read,
    at: notification.createdAt,
    actorName: notification.actor?.name || null,
    ticketRouteId: notification.ticket?._id || null,
    ticketCode: notification.ticket?.ticketId || null,
  };
}

export function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "?";
}
