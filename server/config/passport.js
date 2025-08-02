const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");

module.exports = function (passport) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_URL}/auth/github/callback`,
      },
      // This whole function gets updated
      async (accessToken, refreshToken, profile, done) => {
        const userFields = {
          githubId: profile.id,
          username: profile.username,
          avatarUrl: profile._json.avatar_url,
          accessToken: accessToken, // <-- Save the user's unique token
        };

        try {
          // Find the user and update their info, or create them if they don't exist.
          // This is a more efficient way to handle it.
          const user = await User.findOneAndUpdate(
            { githubId: profile.id },
            userFields,
            { new: true, upsert: true }
          );
          done(null, user);
        } catch (err) {
          console.error(err);
          done(err, null);
        }
      }
    )
  );

  // Serialize/Deserialize remains the same
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};
