const express = require("express");
const { register, registerAdmin, login } = require("../controllers/authController");
const router = express.Router();
router.post("/admin/register", registerAdmin);
router.post("/register", register);
router.post("/login", login);
module.exports = router;
