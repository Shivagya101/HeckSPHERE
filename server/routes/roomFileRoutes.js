const express = require("express");
const router = express.Router({ mergeParams: true });
const multer = require("multer");
const path = require("path");
const { ensureAuth } = require("../middleware/auth"); // Import the new middleware
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
router.post("/", ensureAuth, upload.single("file"), uploadFile);

// Use ensureAuth
router.get("/", ensureAuth, listFiles);

// Use ensureAuth
router.get("/:fileId", ensureAuth, downloadFile);

module.exports = router;
