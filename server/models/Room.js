const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  // optional: you can add metadata like owner, title, etc.
});

module.exports = mongoose.model("Room", RoomSchema);
