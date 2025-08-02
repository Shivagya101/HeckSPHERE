const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  from: { type: String, required: true }, // username
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);
