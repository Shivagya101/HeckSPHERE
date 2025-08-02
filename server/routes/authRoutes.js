const express = require("express");
const passport = require("passport");
const router = express.Router();

// @desc    Auth with GitHub
// @route   GET /auth/github
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

// @desc    GitHub auth callback
// @route   GET /auth/github/callback
router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: `${process.env.CLIENT_URL}/login`, // Using environment variable
  }),
  (req, res) => {
    // Successful authentication, redirect to the frontend dashboard.
    res.redirect(`${process.env.CLIENT_URL}/dashboard`); // Using environment variable
  }
);

// @desc    Check if user is logged in
// @route   GET /auth/me
router.get("/me", (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

// @desc    Logout user
// @route   GET /auth/logout
router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect(process.env.CLIENT_URL); // Using environment variable
  });
});

module.exports = router;
