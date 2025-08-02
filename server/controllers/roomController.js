// controllers/roomController.js
const Room = require("../models/Room");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");

const generateUniqueRoomId = async () => {
  while (true) {
    const candidate = nanoid(8);
    const exists = await Room.findOne({ roomId: candidate });
    if (!exists) return candidate;
  }
};

const createRoom = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 4) {
      return res
        .status(400)
        .json({ error: "Password must be at least 4 characters." });
    }

    const roomId = await generateUniqueRoomId();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const room = new Room({ roomId, passwordHash });
    await room.save();

    res.json({ roomId });
  } catch (err) {
    console.error("createRoom error:", err);
    res.status(500).json({ error: "Failed to create room." });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { roomId, password, username } = req.body;
    if (!roomId || !password || !username) {
      return res
        .status(400)
        .json({ error: "roomId, password, and username required." });
    }

    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ error: "Room not found." });

    const isMatch = await bcrypt.compare(password, room.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign(
      { roomId, username: username.trim() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({ roomId, token });
  } catch (err) {
    console.error("joinRoom error:", err);
    res.status(500).json({ error: "Failed to join room." });
  }
};

module.exports = { createRoom, joinRoom };
