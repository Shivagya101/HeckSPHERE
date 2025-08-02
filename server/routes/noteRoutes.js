const express = require("express");
const router = express.Router({ mergeParams: true });
const verifyRoomToken = require("../middleware/authRoom");
const { getNote } = require("../controllers/noteController");

router.get("/", verifyRoomToken, (req, res) => {
  if (req.roomId !== req.params.roomId) {
    return res.status(403).json({ error: "Room mismatch." });
  }
  return getNote(req, res);
});

module.exports = router;
