const { asyncHandler, sendSuccess } = require("../utils/apiResponse");
const allocationService = require("../services/allocationService");

/** GET /api/allocation */
const getSettings = asyncHandler(async (req, res) => {
  const settings = await allocationService.getSettings(req.organizationId);
  return sendSuccess(res, 200, settings);
});

/** PUT /api/allocation — persists mode + strategy in the database. */
const updateSettings = asyncHandler(async (req, res) => {
  const settings = await allocationService.updateSettings({ ...(req.body || {}), organizationId: req.organizationId });
  return sendSuccess(res, 200, settings);
});

/** POST /api/allocation/assign/:ticketId — automatic assignment for one ticket. */
const assignTicket = asyncHandler(async (req, res) => {
  const result = await allocationService.assignTicketAutomatically({
    ticketId: req.params.ticketId,
    actorId: req.user._id,
    organizationId: req.organizationId,
    allowReassign: req.body?.allowReassign === true,
  });

  if (result.error) {
    res.status(result.status || 400);
    throw new Error(result.error);
  }

  return sendSuccess(res, 200, result.ticket);
});

/** POST /api/allocation/assign-all — automatic assignment for every unassigned ticket. */
const assignAllUnassigned = asyncHandler(async (req, res) => {
  const result = await allocationService.assignAllUnassigned({ actorId: req.user._id, organizationId: req.organizationId });

  if (result.error) {
    res.status(result.status || 400);
    throw new Error(result.error);
  }

  return sendSuccess(res, 200, result);
});

module.exports = { getSettings, updateSettings, assignTicket, assignAllUnassigned };
