/**
 * Orchestrates the A.E. code-analysis flow for a single ticket:
 * find a supported code attachment, read it safely off disk, send it
 * to the LLM service, and validate/normalize the response before it
 * is ever saved or returned to the frontend.
 *
 * This file NEVER executes uploaded code — it only reads it as text.
 */

const fs = require("fs/promises");
const path = require("path");
const { UPLOAD_DIR } = require("../../middleware/uploadMiddleware");
const {
  ANALYZABLE_EXTENSIONS,
  LANGUAGE_BY_EXTENSION,
  MAX_CODE_FILE_BYTES,
  MAX_SOURCE_CHARS,
} = require("../../config/aiPolicy");
const { SYSTEM_INSTRUCTIONS, buildUserPrompt } = require("./prompts");
const { generateAnalysis } = require("./llmService");

class CodeAnalysisError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "CodeAnalysisError";
    // "no_code_attachment" | "invalid_reference" | "file_missing" | "too_large" | "read_error" | "invalid_response"
    this.code = code;
  }
}

/** Picks the first attachment whose extension is analyzable. */
function findAnalyzableAttachment(ticket) {
  return (ticket.attachments || []).find((a) =>
    ANALYZABLE_EXTENSIONS.has(path.extname(a.originalName).toLowerCase())
  );
}

/**
 * Reads an attachment's file content as UTF-8 text.
 * Same path-traversal defense-in-depth check used in
 * attachmentController.js's downloadAttachment.
 */
async function readSourceFile(attachment) {
  const filePath = path.join(UPLOAD_DIR, attachment.filename);

  if (!filePath.startsWith(UPLOAD_DIR)) {
    throw new CodeAnalysisError("Invalid attachment reference.", "invalid_reference");
  }

  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch (error) {
    throw new CodeAnalysisError("The uploaded file is no longer available on the server.", "file_missing");
  }

  if (stat.size > MAX_CODE_FILE_BYTES) {
    throw new CodeAnalysisError("Code file is too large for AI analysis.", "too_large");
  }

  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    throw new CodeAnalysisError("The uploaded file could not be read as text.", "read_error");
  }
}

const ALLOWED_SEVERITIES = new Set(["critical", "high", "medium", "low"]);

/** Minimal structural check before we trust/store the AI's JSON. */
function isPlausibleAiResponse(parsed) {
  if (!parsed || typeof parsed !== "object") return false;
  if (typeof parsed.summary !== "string" || !parsed.summary.trim()) return false;
  if (!Array.isArray(parsed.issues)) return false;
  return parsed.issues.every(
    (issue) =>
      issue &&
      typeof issue === "object" &&
      typeof issue.severity === "string" &&
      (typeof issue.problem === "string" || typeof issue.title === "string")
  );
}

/** Fills in safe defaults for any field the model omitted or got wrong. */
function normalizeAiResponse(parsed, { fileName, language, truncated }) {
  const issues = parsed.issues.map((issue) => ({
    line: Number.isInteger(issue.line) ? issue.line : null,
    severity: ALLOWED_SEVERITIES.has(String(issue.severity).toLowerCase())
      ? String(issue.severity).toLowerCase()
      : "medium",
    title: issue.title || issue.problem || "Issue",
    problem: issue.problem || issue.title || "",
    explanation: typeof issue.explanation === "string" ? issue.explanation : "",
    suggestion: typeof issue.suggestion === "string" ? issue.suggestion : "",
    suggestedFix: typeof issue.suggestedFix === "string" ? issue.suggestedFix : null,
  }));

  const confidence =
    typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1
      ? parsed.confidence
      : null;

  return {
    fileName,
    language: typeof parsed.language === "string" && parsed.language ? parsed.language : language,
    summary: parsed.summary,
    issues,
    overallAssessment: typeof parsed.overallAssessment === "string" ? parsed.overallAssessment : "",
    confidence,
    truncated,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Runs the full A.E. flow for a ticket. Throws CodeAnalysisError /
 * LlmServiceError on failure — the controller translates those into
 * HTTP responses. Returns the normalized analysis object on success,
 * ready to be saved directly into Ticket.aiAnalysis.
 */
async function analyzeTicketCode(ticket) {
  const attachment = findAnalyzableAttachment(ticket);
  if (!attachment) {
    throw new CodeAnalysisError("No supported code files were found for analysis.", "no_code_attachment");
  }

  const ext = path.extname(attachment.originalName).toLowerCase();
  const language = LANGUAGE_BY_EXTENSION[ext] || "unknown";

  let code = await readSourceFile(attachment);

  let truncated = false;
  if (code.length > MAX_SOURCE_CHARS) {
    code = code.slice(0, MAX_SOURCE_CHARS);
    truncated = true;
  }

  const userPrompt = buildUserPrompt({ fileName: attachment.originalName, language, code, truncated });

  const rawText = await generateAnalysis({ systemInstructions: SYSTEM_INSTRUCTIONS, userPrompt });

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    throw new CodeAnalysisError(
      "The AI provider returned a response that could not be parsed.",
      "invalid_response"
    );
  }

  if (!isPlausibleAiResponse(parsed)) {
    throw new CodeAnalysisError("The AI provider returned an unexpected response shape.", "invalid_response");
  }

  return normalizeAiResponse(parsed, { fileName: attachment.originalName, language, truncated });
}

module.exports = { analyzeTicketCode, CodeAnalysisError };
