const Note = require("../models/Note");

const getNote = async (req, res) => {
  try {
    // FIX: Get roomId from req.params
    const { roomId } = req.params;
    let note = await Note.findOne({ roomId });
    if (!note) {
      note = await Note.create({ roomId });
    }
    res.json({
      content: note.content,
      lastEditor: note.lastEditor,
      updatedAt: note.updatedAt,
    });
  } catch (err) {
    console.error("getNote error:", err);
    res.status(500).json({ error: "Failed to load note." });
  }
};

module.exports = { getNote };
