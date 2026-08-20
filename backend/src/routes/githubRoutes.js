const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const { getAuthUrl, callback, status, repos, selectRepository, disconnect } = require("../controllers/githubController");
const { getRepository, listFiles, readFile, saveFile } = require("../controllers/repositoryController");
const router = express.Router();
router.get("/auth-url", protect, requireRole("admin"), getAuthUrl);
router.get("/callback", callback);
router.get("/status", protect, requireRole("admin"), status);
router.get("/repos", protect, requireRole("admin"), repos);
router.post("/repository", protect, requireRole("admin"), selectRepository);
router.delete("/connection", protect, requireRole("admin"), disconnect);
// Uses the organization's admin-connected token. Employees can edit only
// their own organization's repository and never receive the token itself.
// GitHub OAuth, repository selection, and disconnect remain admin-only above.
router.get("/repository/current", protect, requireRole("admin", "employee"), getRepository);
router.get("/repository/files", protect, requireRole("admin", "employee"), listFiles);
router.get("/repository/file", protect, requireRole("admin", "employee"), readFile);
router.put("/repository/file", protect, requireRole("admin", "employee"), saveFile);
module.exports = router;
