const express = require("express");
const {
  createTicket,
  getMyTickets,
  getTicketById,
  getAllTickets,
  updateTicket,
  addTicketActivity,
  getTicketActivity,
  getTicketStats,
  getTicketAnalytics,
  getAssignedTickets,
  getEmployeeStats,
  escalateTicket,
  getEscalatedTickets,
} = require("../controllers/ticketController");
const { protect } = require("../middleware/authMiddleware");
const { analyzeCode, getAiAnalysis, analyzeRepository, getRepoAnalysis } = require("../controllers/aiController");
const { requireRole } = require("../middleware/roleMiddleware");
const { uploadTicketAttachments } = require("../middleware/uploadMiddleware");
const {
  uploadAttachments,
  listAttachments,
  downloadAttachment,
  deleteAttachment,
} = require("../controllers/attachmentController");

const router = express.Router();

// All ticket routes require authentication
router.use(protect);

// IMPORTANT: specific/static routes must be declared before "/:id"
// otherwise Express would treat "my" or "stats" as an :id value.
router.get("/my", getMyTickets);
router.get("/stats", requireRole("admin"), getTicketStats);
router.get("/analytics", requireRole("admin"), getTicketAnalytics);
router.get("/escalated", requireRole("admin"), getEscalatedTickets);
router.get("/employee", requireRole("employee"), getAssignedTickets);
router.get("/employee/stats", requireRole("employee"), getEmployeeStats);

router.route("/").get(requireRole("admin"), getAllTickets).post(createTicket);

router.route("/:id").get(getTicketById).put(updateTicket);

router.get("/:id/activity", getTicketActivity);
router.post("/:id/activity", addTicketActivity);

// Employee-only: escalate a ticket assigned to them back to Admin.
// requireRole("employee") is a first line of defense; the controller
// additionally re-verifies assignedTo against req.user from the JWT.
router.post("/:id/escalate", requireRole("employee"), escalateTicket);

router.post("/:id/attachments", uploadTicketAttachments, uploadAttachments);
router.get("/:id/attachments", listAttachments);
router.get("/:ticketId/attachments/:attachmentId", downloadAttachment);
router.delete("/:ticketId/attachments/:attachmentId", deleteAttachment);

// A.E. — AI Engine / LLM code analysis. Admin only: clients can
// neither trigger nor read the analysis.
router.post("/:id/ai/analyze", requireRole("admin", "employee"), analyzeCode);
router.get("/:id/ai", requireRole("admin", "employee"), getAiAnalysis);
router.post("/:id/ai/analyze-repo", requireRole("admin", "employee"), analyzeRepository);
router.get("/:id/ai/repo", requireRole("admin", "employee"), getRepoAnalysis);

module.exports = router;
