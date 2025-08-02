const express = require("express");
const router = express.Router({ mergeParams: true });
// FIX: Import the new JWT middleware
const authMiddleware = require("../middleware/authMiddleware");
const { fetchRecent } = require("../controllers/chatController");

// FIX: Use the new authMiddleware
router.get("/", authMiddleware, fetchRecent);

module.exports = router;
