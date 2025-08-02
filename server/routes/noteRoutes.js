const express = require("express");
const router = express.Router({ mergeParams: true });
const { ensureAuth } = require("../middleware/auth"); // Import the new middleware
const { getNote } = require("../controllers/noteController");

// Use the new ensureAuth middleware and remove the old checks
router.get("/", ensureAuth, getNote);

module.exports = router;
