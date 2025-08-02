const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied." });
  }

  // The token format is "Bearer <token>"
  const actualToken = token.split(" ")[1];

  try {
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    req.user = decoded; // Add user payload to request
    next();
  } catch (e) {
    res.status(400).json({ message: "Token is not valid." });
  }
};
