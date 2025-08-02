const ChatMessage = require("../models/ChatMessage");

const fetchRecent = async (req, res) => {
  try {
    // FIX: Get roomId from req.params
    const { roomId } = req.params;
    const messages = await ChatMessage.find({ roomId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(messages.reverse());
  } catch (err) {
    console.error("fetchRecent chat error:", err);
    res.status(500).json({ error: "Failed to load chat history." });
  }
};

module.exports = { fetchRecent };
