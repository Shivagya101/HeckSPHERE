const jwt = require("jsonwebtoken");

const verifyRoomToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token provided." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.username) {
      return res.status(401).json({ error: "Username not in token." });
    }
    req.roomId = payload.roomId;
    req.username = payload.username;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token." });
  }
};

module.exports = verifyRoomToken;
