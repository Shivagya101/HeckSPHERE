const express = require("express");
const router = express.Router({ mergeParams: true });
const { ensureAuth } = require("../middleware/auth"); // Import the new middleware
const { fetchRecent } = require("../controllers/chatController");

// Use the new ensureAuth middleware and remove the old checks
router.get("/", ensureAuth, fetchRecent);

module.exports = router;
