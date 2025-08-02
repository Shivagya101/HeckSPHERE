const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  content: { type: String, default: "" },
  lastEditor: { type: String, default: null }, // username
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Note", NoteSchema);
