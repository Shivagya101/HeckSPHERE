const path = require("path");
const fs = require("fs");
const FileMeta = require("../models/FileMeta");

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const uploadFile = async (req, res) => {
  try {
    // GET DATA FROM NEW LOCATIONS
    const { roomId } = req.params;
    const { username } = req.user;

    if (!req.file) return res.status(400).json({ error: "No file provided." });

    const meta = await FileMeta.create({
      roomId,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      uploader: username, // Use username from req.user
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    res.json(meta);
  } catch (err) {
    console.error("uploadFile error:", err);
    res.status(500).json({ error: "Failed to upload file." });
  }
};

const listFiles = async (req, res) => {
  try {
    // GET DATA FROM NEW LOCATIONS
    const { roomId } = req.params;
    const files = await FileMeta.find({ roomId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(files);
  } catch (err) {
    console.error("listFiles error:", err);
    res.status(500).json({ error: "Failed to list files." });
  }
};

const downloadFile = async (req, res) => {
  try {
    // GET DATA FROM NEW LOCATIONS
    const { roomId, fileId } = req.params;
    const file = await FileMeta.findById(fileId);

    if (!file) return res.status(404).json({ error: "File not found." });
    if (file.roomId !== roomId)
      return res.status(403).json({ error: "Room mismatch." });

    const filePath = path.join(process.cwd(), "uploads", file.storedName);
    if (!fs.existsSync(filePath))
      return res.status(410).json({ error: "File missing." });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.originalName}"`
    );
    res.setHeader("Content-Type", file.mimeType);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error("downloadFile error:", err);
    res.status(500).json({ error: "Failed to download file." });
  }
};

module.exports = { uploadFile, listFiles, downloadFile };
