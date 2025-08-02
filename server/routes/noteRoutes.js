const express = require("express");
const router = express.Router({ mergeParams: true });
const authMiddleware = require("../middleware/authMiddleware");
const { getNote } = require("../controllers/noteController");

// Defines GET /
// The full path will be /api/rooms/:roomId/note
router.get("/", authMiddleware, getNote);

module.exports = router;
