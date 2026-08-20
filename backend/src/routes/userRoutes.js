const express = require("express");
const {
  getMe,
  getUsers,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/me", protect, getMe);
router.get("/", protect, requireRole("admin"), getUsers);
router.get("/employees", protect, requireRole("admin"), getUsers);

router.post("/employees", protect, requireRole("admin"), createEmployee);
router.put("/employees/:id", protect, requireRole("admin"), updateEmployee);
router.patch("/employees/:id/status", protect, requireRole("admin"), updateEmployeeStatus);
router.delete("/employees/:id", protect, requireRole("admin"), deleteEmployee);

module.exports = router;
