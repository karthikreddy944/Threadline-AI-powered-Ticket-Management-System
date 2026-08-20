const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_FILES_PER_UPLOAD,
  STRICT_MIME_BY_EXTENSION,
  ALLOWED_EXTENSIONS,
} = require("../config/attachmentPolicy");

// backend/uploads/tickets — created on startup if it doesn't exist yet.
const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "tickets");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

class UploadValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "UploadValidationError";
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Never trust the client-supplied filename. Generate a random name
    // and keep only the (already-validated) extension, so there is no
    // path-traversal surface and no collision risk.
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new UploadValidationError(`File type "${ext || "unknown"}" is not allowed.`));
  }

  const strictMimeList = STRICT_MIME_BY_EXTENSION[ext];
  if (strictMimeList && !strictMimeList.includes(file.mimetype)) {
    return cb(
      new UploadValidationError(`File "${file.originalname}" does not match the expected type for ${ext}.`)
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES_PER_UPLOAD,
  },
});

/**
 * Wraps multer's .array() so validation/size/count errors come back as
 * clean JSON (matching the rest of the API) instead of an unhandled
 * exception or a raw stack trace.
 */
const uploadTicketAttachments = (req, res, next) => {
  upload.array("files", MAX_FILES_PER_UPLOAD)(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB per file.`,
        });
      }
      if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          message: `Too many files. Maximum is ${MAX_FILES_PER_UPLOAD} files per upload.`,
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }

    if (err instanceof UploadValidationError) {
      return res.status(400).json({ success: false, message: err.message });
    }

    return res.status(400).json({ success: false, message: "Upload failed." });
  });
};

module.exports = { uploadTicketAttachments, UPLOAD_DIR };
