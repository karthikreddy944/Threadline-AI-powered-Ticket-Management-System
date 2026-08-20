/**
 * Central policy for the AI Engine (A.E.) — which uploaded file
 * extensions are eligible for LLM code analysis, size limits, and
 * the Gemini model used. Mirrors the style of attachmentPolicy.js.
 */

// Must stay a subset of ALLOWED_EXTENSIONS in attachmentPolicy.js.
// Images, PDFs, Word docs, and archives are never analyzable.
const ANALYZABLE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".html",
  ".css",
  ".json",
]);

// Rough extension -> language label, used in the prompt and the UI.
const LANGUAGE_BY_EXTENSION = {
  ".js": "javascript",
  ".jsx": "javascript (jsx)",
  ".ts": "typescript",
  ".tsx": "typescript (tsx)",
  ".py": "python",
  ".java": "java",
  ".c": "c",
  ".cpp": "c++",
  ".h": "c header",
  ".hpp": "c++ header",
  ".html": "html",
  ".css": "css",
  ".json": "json",
};

// Hard ceiling on disk size — anything larger is rejected outright
// before it's ever read into memory or sent anywhere. Well under the
// existing 10MB attachment limit; source files this large are not a
// realistic single-file code review target.
const MAX_CODE_FILE_BYTES = 300 * 1024; // 300 KB

// Soft character budget for what's actually sent to the LLM. A file
// under MAX_CODE_FILE_BYTES can still exceed this — in that case the
// code is truncated (and the response is clearly marked truncated)
// rather than blindly sending an enormous prompt.
const MAX_SOURCE_CHARS = 60000;

const DEFAULT_MODEL = "gemini-3.6-flash";

module.exports = {
  ANALYZABLE_EXTENSIONS,
  LANGUAGE_BY_EXTENSION,
  MAX_CODE_FILE_BYTES,
  MAX_SOURCE_CHARS,
  DEFAULT_MODEL,
};
