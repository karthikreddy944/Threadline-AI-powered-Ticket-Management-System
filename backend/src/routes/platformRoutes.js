const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const { listAdministrators, updateAdministratorAccess, getAiSettings, updateAiSettings } = require("../controllers/platformController");

const router = express.Router();
router.use(protect, requireRole("superadmin"));
router.get("/administrators", listAdministrators);
router.patch("/administrators/:organizationId", updateAdministratorAccess);
router.get("/ai-settings", getAiSettings);
router.patch("/ai-settings", updateAiSettings);
module.exports = router;
