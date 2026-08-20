const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const { getSettings, updateSettings, assignTicket, assignAllUnassigned } = require("../controllers/allocationController");

const r = express.Router();
r.use(protect, requireRole("admin"));

r.get("/", getSettings);
r.put("/", updateSettings);
r.post("/assign-all", assignAllUnassigned);
r.post("/assign/:ticketId", assignTicket);

module.exports = r;
