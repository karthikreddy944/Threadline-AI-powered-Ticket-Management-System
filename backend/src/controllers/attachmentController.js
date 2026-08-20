const fs = require("fs");
const path = require("path");
const Ticket = require("../models/Ticket");
const { asyncHandler, sendSuccess } = require("../utils/apiResponse");
const { logActivity } = require("../services/ticketService");
const { notifyAdmins } = require("../services/notificationService");
const { UPLOAD_DIR } = require("../middleware/uploadMiddleware");
const { IMAGE_EXTENSIONS } = require("../config/attachmentPolicy");

// Same "owner or admin" rule used throughout ticketController.
const canAccessTicket = (ticket, user) =>
  ticket.createdBy.toString() === user._id.toString() || user.role === "admin";

// Never return the on-disk filename or path to the client — only what
// the UI needs. Downloads go through /attachments/:attachmentId instead
// of a raw file path.
const toPublicAttachment = (attachment, ticketId) => ({
  id: attachment._id,
  originalName: attachment.originalName,
  mimeType: attachment.mimeType,
  size: attachment.size,
  uploadedAt: attachment.uploadedAt,
  isImage: IMAGE_EXTENSIONS.has(path.extname(attachment.originalName).toLowerCase()),
  downloadUrl: `/api/tickets/${ticketId}/attachments/${attachment._id}`,
});

// Deletes files already written to disk by multer, e.g. when the
// authorization check fails after the upload already happened.
const cleanupUploadedFiles = (files = []) => {
  files.forEach((file) => {
    fs.unlink(file.path, () => {});
  });
};

/**
 * POST /api/tickets/:id/attachments
 * Ticket owner or admin only. Files are already on disk (written by
 * multer) by the time this runs; we just validate access and record
 * the metadata.
 */
const uploadAttachments = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    cleanupUploadedFiles(req.files);
    res.status(404);
    throw new Error("Ticket not found");
  }

  if (!canAccessTicket(ticket, req.user)) {
    cleanupUploadedFiles(req.files);
    res.status(403);
    throw new Error("Forbidden: you do not have access to this ticket");
  }

  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("No files were uploaded");
  }

  const newAttachments = req.files.map((file) => ({
    originalName: file.originalname,
    filename: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    uploadedBy: req.user._id,
    uploadedAt: new Date(),
  }));

  ticket.attachments.push(...newAttachments);
  await ticket.save();

  await logActivity({
    ticket: ticket._id,
    actor: req.user._id,
    action: "attachment_added",
    message:
      newAttachments.length === 1
        ? `Attached ${newAttachments[0].originalName}`
        : `Attached ${newAttachments.length} files`,
  });

  // Only notify admins for client-side uploads; an admin attaching a
  // file to a ticket they're already working doesn't need its own alert.
  if (req.user.role !== "admin") {
    await notifyAdmins({
      type: "attachment_added",
      title: `New attachment on ${ticket.ticketId}`,
      message:
        newAttachments.length === 1
          ? `${req.user.name} attached ${newAttachments[0].originalName} to ${ticket.ticketId}.`
          : `${req.user.name} attached ${newAttachments.length} files to ${ticket.ticketId}.`,
      ticket: ticket._id,
      actor: req.user._id,
    });
  }

  const saved = ticket.attachments.slice(-newAttachments.length);
  return sendSuccess(
    res,
    201,
    saved.map((a) => toPublicAttachment(a, ticket._id))
  );
});

/**
 * GET /api/tickets/:id/attachments
 * Ticket owner or admin only.
 */
const listAttachments = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  if (!canAccessTicket(ticket, req.user)) {
    res.status(403);
    throw new Error("Forbidden: you do not have access to this ticket");
  }

  return sendSuccess(
    res,
    200,
    ticket.attachments.map((a) => toPublicAttachment(a, ticket._id))
  );
});

/**
 * GET /api/tickets/:ticketId/attachments/:attachmentId
 * Ticket owner or admin only. Streams the file — never served through
 * static middleware, so this check always runs first.
 */
const downloadAttachment = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.ticketId);

  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  if (!canAccessTicket(ticket, req.user)) {
    res.status(403);
    throw new Error("Forbidden: you do not have access to this ticket");
  }

  const attachment = ticket.attachments.id(req.params.attachmentId);
  if (!attachment) {
    res.status(404);
    throw new Error("Attachment not found");
  }

  const filePath = path.join(UPLOAD_DIR, attachment.filename);

  // Defense in depth: filename is always a generated UUID with no
  // separators, but confirm the resolved path still lives inside the
  // uploads directory before touching the filesystem.
  if (!filePath.startsWith(UPLOAD_DIR)) {
    res.status(400);
    throw new Error("Invalid attachment reference");
  }

  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("File is no longer available on the server");
  }

  res.set("Content-Type", attachment.mimeType);
  const disposition = req.query.mode === "inline" ? "inline" : "attachment";
  res.set(
    "Content-Disposition",
    `${disposition}; filename="${encodeURIComponent(attachment.originalName)}"`
  );
  return res.sendFile(filePath);
});

/**
 * DELETE /api/tickets/:ticketId/attachments/:attachmentId
 * Ticket owner or admin only.
 */
const deleteAttachment = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.ticketId);

  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  if (!canAccessTicket(ticket, req.user)) {
    res.status(403);
    throw new Error("Forbidden: you do not have access to this ticket");
  }

  const attachment = ticket.attachments.id(req.params.attachmentId);
  if (!attachment) {
    res.status(404);
    throw new Error("Attachment not found");
  }

  const filePath = path.join(UPLOAD_DIR, attachment.filename);
  const originalName = attachment.originalName;

  ticket.attachments.pull(attachment._id);
  await ticket.save();

  fs.unlink(filePath, () => {}); // best-effort; metadata is already gone either way

  await logActivity({
    ticket: ticket._id,
    actor: req.user._id,
    action: "attachment_removed",
    message: `Removed attachment ${originalName}`,
  });

  return sendSuccess(
    res,
    200,
    ticket.attachments.map((a) => toPublicAttachment(a, ticket._id))
  );
});

module.exports = { uploadAttachments, listAttachments, downloadAttachment, deleteAttachment };
