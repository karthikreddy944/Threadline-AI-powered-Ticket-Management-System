/**
 * Central policy for ticket attachments: which file types are allowed,
 * how big they can be, and how many can be attached at once.
 *
 * Extension is the primary check (case-insensitive, based on the actual
 * file content on disk after multer writes it — not trusted as-is from
 * the client). MIME type is used as a secondary check only for file
 * types where browsers report it reliably (images, PDF, zip, Word docs).
 * Code/text files are notoriously inconsistent across browsers/OSes
 * (e.g. a .py file may arrive as "text/x-python", "text/plain", or
 * "application/octet-stream" depending on the OS), so those are
 * validated by extension only.
 */

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_FILES_PER_UPLOAD = 5;

// Extensions where we also cross-check the browser-reported MIME type.
const STRICT_MIME_BY_EXTENSION = {
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".webp": ["image/webp"],
  ".pdf": ["application/pdf"],
  ".zip": ["application/zip", "application/x-zip-compressed", "application/octet-stream"],
  ".doc": ["application/msword"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

// Extensions allowed by name only (no reliable MIME to cross-check).
const EXTENSION_ONLY = [
  ".txt",
  ".csv",
  ".md",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".html",
  ".css",
  ".json",
  ".py",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
];

const ALLOWED_EXTENSIONS = new Set([
  ...Object.keys(STRICT_MIME_BY_EXTENSION),
  ...EXTENSION_ONLY,
]);

// Extensions that should render as an image preview in the UI.
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

module.exports = {
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_UPLOAD,
  STRICT_MIME_BY_EXTENSION,
  ALLOWED_EXTENSIONS,
  IMAGE_EXTENSIONS,
};
