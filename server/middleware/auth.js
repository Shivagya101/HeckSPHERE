module.exports = {
  ensureAuth: function (req, res, next) {
    if (req.isAuthenticated()) {
      // isAuthenticated() is from Passport.js
      return next();
    } else {
      res.status(401).json({ error: "You must be logged in to do that." });
    }
  },
};
