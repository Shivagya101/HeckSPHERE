const express = require("express");
const router = express.Router({ mergeParams: true });
const multer = require("multer");
const path = require("path");
const verifyRoomToken = require("../middleware/authRoom");
const {
  uploadFile,
  listFiles,
  downloadFile,
} = require("../controllers/fileController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(process.cwd(), "uploads"));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});
const upload = multer({ storage });

router.post("/", verifyRoomToken, (req, res, next) => {
  if (req.roomId !== req.params.roomId)
    return res.status(403).json({ error: "Room mismatch." });
  upload.single("file")(req, res, (err) => {
    if (err) return next(err);
    uploadFile(req, res);
  });
});

router.get("/", verifyRoomToken, (req, res) => {
  if (req.roomId !== req.params.roomId)
    return res.status(403).json({ error: "Room mismatch." });
  listFiles(req, res);
});

router.get("/:fileId", verifyRoomToken, (req, res) => {
  if (req.roomId !== req.params.roomId)
    return res.status(403).json({ error: "Room mismatch." });
  downloadFile(req, res);
});

module.exports = router;
