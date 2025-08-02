const mongoose = require("mongoose");

const FileMetaSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  originalName: String,
  storedName: String,
  uploader: String, // username
  mimeType: String,
  size: Number,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("FileMeta", FileMetaSchema);
