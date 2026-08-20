const Ticket = require("../models/Ticket");
const { asyncHandler, sendSuccess } = require("../utils/apiResponse");
const { logActivity } = require("../services/ticketService");
const { analyzeTicketCode: runCodeAnalysis, CodeAnalysisError } = require("../services/ai/codeAnalyzer");
const { LlmServiceError } = require("../services/ai/llmService");
const { analyzeTicketRepository, RepoAnalysisError } = require("../services/ai/repoAnalyzer");
const { notifyAdmins } = require("../services/notificationService");
const PlatformSettings = require("../models/PlatformSettings");

async function assertPlatformAiEnabled(kind) {
  const settings = await PlatformSettings.findOne({ key: "platform" });
  const enabled = settings?.ai?.enabled !== false && (kind === "code" ? settings?.ai?.codeAnalysisEnabled !== false : settings?.ai?.repositoryAnalysisEnabled !== false);
  if (!enabled) {
    const error = new Error("This AI feature is currently disabled by Platform Operations.");
    error.statusCode = 403;
    throw error;
  }
}


function assertStaffTicketAccess(req, res, ticket) {
  if (req.user.role === "admin") return;
  if (req.user.role === "employee" && ticket.assignedTo?.toString() === req.user._id.toString()) return;
  res.status(403);
  throw new Error("Only the admin or assigned employee can access this AI analysis");
}

// Maps internal error codes to HTTP status codes. Messages are already
// safe/generic (see codeAnalyzer.js / llmService.js) — never leak raw
// provider errors, stack traces, or the API key here.
const STATUS_BY_ERROR_CODE = {
  invalid_reference: 400,
  file_missing: 404,
  too_large: 400,
  read_error: 400,
  invalid_response: 502,
  missing_api_key: 503,
  provider_unavailable: 502,
  timeout: 504,
  rate_limit: 429,
  no_repository: 400,
  no_source_files: 400,
  github_not_connected: 400,
  github_unauthorized: 401,
  github_forbidden: 403,
  github_not_found: 404,
  github_unavailable: 502,
  github_oauth_failed: 502,
};

/**
 * POST /api/tickets/:id/ai/analyze
 * Staff only: admins and the employee currently assigned to the ticket.
 * Finds the ticket's supported code attachment, sends it to the LLM,
 * validates the response, and saves it to Ticket.aiAnalysis.
 */
const analyzeCode = asyncHandler(async (req, res) => {
  await assertPlatformAiEnabled("code");
  if (req.organization?.subscription?.aiEnabled === false) { res.status(403); throw new Error("AI analysis is disabled for this organization. Contact your administrator."); }
  const ticket = await Ticket.findOne({ _id: req.params.id, organizationId: req.organizationId });
  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }
  assertStaffTicketAccess(req, res, ticket);

  let analysis;
  try {
    analysis = await runCodeAnalysis(ticket);
  } catch (error) {
    if (error instanceof CodeAnalysisError && error.code === "no_code_attachment") {
      // Not a failure — there is simply nothing to analyze yet.
      return sendSuccess(res, 200, {
        status: "no_code_attachment",
        message: error.message,
        analysis: null,
      });
    }

    if (error instanceof CodeAnalysisError || error instanceof LlmServiceError) {
      res.status(STATUS_BY_ERROR_CODE[error.code] || 500);
      throw new Error(error.message);
    }

    throw error; // unexpected — let the centralized error handler deal with it
  }

  ticket.aiAnalysis = analysis;
  await ticket.save();

  await logActivity({
    ticket: ticket._id,
    actor: req.user._id,
    action: "ai_analysis_completed",
    message: `AI analysis completed for ${analysis.fileName} (${analysis.issues.length} issue${
      analysis.issues.length === 1 ? "" : "s"
    } found)`,
  });

  return sendSuccess(res, 200, { status: "ok", message: null, analysis });
});

/**
 * GET /api/tickets/:id/ai
 * Staff only. Returns the last saved AI analysis for a ticket, or
 * null if it hasn't been analyzed yet.
 */
const getAiAnalysis = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({ _id: req.params.id, organizationId: req.organizationId }).select("aiAnalysis");
  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }
  if (req.user.role === "employee") {
    const full = await Ticket.findOne({ _id: req.params.id, organizationId: req.organizationId }).select("assignedTo");
    assertStaffTicketAccess(req, res, full);
  }

  return sendSuccess(res, 200, {
    status: ticket.aiAnalysis ? "ok" : "not_analyzed",
    message: null,
    analysis: ticket.aiAnalysis || null,
  });
});

const analyzeRepository = asyncHandler(async (req, res) => {
  await assertPlatformAiEnabled("repository");
  if (req.organization?.subscription?.aiEnabled === false) { res.status(403); throw new Error("AI analysis is disabled for this organization. Contact your administrator."); }
  const ticket = await Ticket.findOne({ _id: req.params.id, organizationId: req.organizationId });
  if (!ticket) { res.status(404); throw new Error("Ticket not found"); }
  assertStaffTicketAccess(req, res, ticket);
  let analysis;
  try { analysis = await analyzeTicketRepository(ticket); }
  catch (error) {
    if (error instanceof RepoAnalysisError || error instanceof LlmServiceError) {
      // Surface GitHub-specific failures (expired auth, repo missing, etc.)
      // to other admins, since these usually need someone to reconnect
      // GitHub or fix the repository link rather than retrying the AI call.
      if (String(error.code || "").startsWith("github_")) {
        await notifyAdmins({
          type: "repo_analysis_failed",
          title: `GitHub issue on ${ticket.ticketId}`,
          message: `AI repository analysis for ${ticket.ticketId} failed: ${error.message}`,
          ticket: ticket._id,
          actor: req.user._id,
        });
      }
      res.status(STATUS_BY_ERROR_CODE[error.code] || 500);
      throw new Error(error.message);
    }
    throw error;
  }
  ticket.repoAnalysis = analysis; await ticket.save();
  await logActivity({ ticket: ticket._id, actor: req.user._id, action: "ai_analysis_completed", message: `AI repository analysis completed (${analysis.findings.length} finding${analysis.findings.length===1?"":"s"} found)` });
  await notifyAdmins({
    type: "repo_analysis_completed",
    title: `AI analysis ready for ${ticket.ticketId}`,
    message: `AI repository analysis completed for ${ticket.ticketId}.`,
    ticket: ticket._id,
    actor: req.user._id,
  });
  return sendSuccess(res, 200, { status: "ok", analysis });
});

const getRepoAnalysis = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({ _id: req.params.id, organizationId: req.organizationId }).select("repoAnalysis githubRepo");
  if (!ticket) { res.status(404); throw new Error("Ticket not found"); }
  if (req.user.role === "employee") { const full = await Ticket.findOne({ _id: req.params.id, organizationId: req.organizationId }).select("assignedTo"); assertStaffTicketAccess(req, res, full); }
  return sendSuccess(res, 200, { status: ticket.repoAnalysis ? "ok" : "not_analyzed", analysis: ticket.repoAnalysis || null, repository: ticket.githubRepo || null });
});

module.exports = { analyzeCode, getAiAnalysis, analyzeRepository, getRepoAnalysis };
