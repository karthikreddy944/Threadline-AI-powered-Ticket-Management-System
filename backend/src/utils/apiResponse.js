/**
 * Wraps an async route handler so thrown errors are passed to
 * the centralized error middleware instead of crashing the server.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const sendSuccess = (res, statusCode, data) => {
  return res.status(statusCode).json({ success: true, data });
};

module.exports = { asyncHandler, sendSuccess };
