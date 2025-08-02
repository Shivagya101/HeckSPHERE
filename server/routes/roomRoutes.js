// server/routes/roomRoutes.js

const express = require("express");
const router = express.Router();
const {
  createRoom,
  joinRoom,
  getRepoCommits,
  getUserRooms,
  getRepoBranches,
} = require("../controllers/roomController");
// Import the new JWT middleware
const authMiddleware = require("../middleware/authMiddleware");

// Use the new authMiddleware on all routes
router.get("/", authMiddleware, getUserRooms);
router.post("/create", authMiddleware, createRoom);
router.post("/join", authMiddleware, joinRoom);
router.get("/:roomId/commits", authMiddleware, getRepoCommits);
router.get("/:roomId/commits/branches", authMiddleware, getRepoBranches);

module.exports = router;
