const express = require("express");
const router = express.Router();
const {
  createRoom,
  joinRoom,
  getRepoCommits,
  getUserRooms,
} = require("../controllers/roomController");
const { ensureAuth } = require("../middleware/auth");
const { getRepoBranches } = require("../controllers/roomController");

// GET all rooms for the logged-in user (for the dashboard)
router.get("/", ensureAuth, getUserRooms);

// POST to create a new room
router.post("/create", ensureAuth, createRoom);

// POST to join an existing room
router.post("/join", ensureAuth, joinRoom);
router.get("/:roomId/commits/branches", ensureAuth, getRepoBranches);
// The commits route remains the same, as it will be accessed with a query string
router.get("/:roomId/commits", ensureAuth, getRepoCommits);

module.exports = router;
