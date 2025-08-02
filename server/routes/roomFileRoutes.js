const express = require("express");
const router = express.Router({ mergeParams: true });
const multer = require("multer");
const path = require("path");
// FIX: Import the new JWT middleware
const authMiddleware = require("../middleware/authMiddleware");
const {
  uploadFile,
  listFiles,
  downloadFile,
} = require("../controllers/fileController");

// Multer storage configuration remains the same
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

// Use ensureAuth and the multer upload middleware
router.post("/", authMiddleware, upload.single("file"), uploadFile);

// FIX: Use the new authMiddleware
router.get("/", authMiddleware, listFiles);

// FIX: Use the new authMiddleware
router.get("/:fileId", authMiddleware, downloadFile);

module.exports = router;
