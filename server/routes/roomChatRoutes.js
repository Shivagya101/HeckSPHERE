const express = require("express");
const router = express.Router({ mergeParams: true });
const verifyRoomToken = require("../middleware/authRoom");
const { fetchRecent } = require("../controllers/chatController");

router.get("/", verifyRoomToken, (req, res) => {
  if (req.roomId !== req.params.roomId) {
    return res.status(403).json({ error: "Room mismatch." });
  }
  return fetchRecent(req, res);
});

module.exports = router;
