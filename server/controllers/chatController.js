const ChatMessage = require("../models/ChatMessage");

const fetchRecent = async (req, res) => {
  try {
    const { roomId } = req;
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
