const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  githubId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  avatarUrl: {
    type: String,
  },
  // ADD THIS LINE
  accessToken: {
    type: String,
    required: true,
  },
  joinedRooms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
  ],
});

module.exports = mongoose.model("User", UserSchema);
