/**
 * Client-side attachment constants. These mirror backend/src/config/attachmentPolicy.js
 * so the UI can reject obviously-invalid files before ever hitting the network —
 * but the backend is the source of truth and re-validates everything server-side.
 */

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_FILE_SIZE_LABEL = "10MB";
export const MAX_FILES_PER_UPLOAD = 5;

export const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".csv",
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
  ".md",
  ".zip",
];

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export function getExtension(filename = "") {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? "" : filename.slice(idx).toLowerCase();
}

export function isImageFile(filename = "") {
  return IMAGE_EXTENSIONS.has(getExtension(filename));
}

export function isAllowedExtension(filename = "") {
  return ALLOWED_EXTENSIONS.includes(getExtension(filename));
}

export function formatFileSize(bytes) {
  if (bytes === 0) return "0 KB";
  if (!bytes && bytes !== 0) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * Validates a freshly-picked File against extension and size rules.
 * Returns an error message, or null if the file is fine to add.
 */
export function validateFile(file) {
  if (!isAllowedExtension(file.name)) {
    return `"${file.name}" isn't a supported file type.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `"${file.name}" is larger than ${MAX_FILE_SIZE_LABEL}.`;
  }
  return null;
}
