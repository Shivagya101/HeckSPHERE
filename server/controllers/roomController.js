// server/controllers/roomController.js
const Room = require("../models/Room");
const User = require("../models/User"); // We will create this model next
const { nanoid } = require("nanoid");
const { Octokit } = require("@octokit/rest");

// Initialize Octokit. For higher API rate limits, create a Personal Access Token on GitHub
// with 'repo' scope and add it to your .env file.

// This function remains the same
const generateUniqueRoomId = async () => {
  while (true) {
    const candidate = nanoid(8);
    const exists = await Room.findOne({ roomId: candidate });
    if (!exists) return candidate;
  }
};

// COMPLETELY REWRITTEN
const createRoom = async (req, res) => {
  try {
    const { repoUrl } = req.body;
    // Validate the GitHub repo URL format
    if (!repoUrl || !repoUrl.startsWith("https://github.com/")) {
      return res
        .status(400)
        .json({ error: "A valid GitHub repository URL is required." });
    }

    const roomId = await generateUniqueRoomId();

    const newRoom = new Room({
      roomId,
      repoUrl,
      creator: req.user.id, // req.user is provided by Passport.js after login
      members: [req.user.id], // The creator is the first member
    });

    await newRoom.save();

    // Also add this room to the creator's list of joined rooms
    await User.findByIdAndUpdate(req.user.id, {
      $push: { joinedRooms: newRoom._id },
    });

    res.status(201).json({ roomId: newRoom.roomId });
  } catch (err) {
    console.error("createRoom error:", err);
    res.status(500).json({ error: "Failed to create room." });
  }
};

// COMPLETELY REWRITTEN
const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId) {
      return res.status(400).json({ error: "Room ID is required." });
    }

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: "Room not found." });
    }

    // Add user to room's members and room to user's list if not already a member
    await Room.updateOne({ roomId }, { $addToSet: { members: req.user.id } });
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { joinedRooms: room._id },
    });

    res.json({ roomId: room.roomId, message: "Successfully joined room." });
  } catch (err) {
    console.error("joinRoom error:", err);
    res.status(500).json({ error: "Failed to join room." });
  }
};
// Inside server/controllers/roomController.js

const getRepoCommits = async (req, res) => {
  try {
    const { branch } = req.query; // Get branch name from query parameter
    if (!branch)
      return res.status(400).json({ message: "Branch name is required." });

    const room = await Room.findOne({ roomId: req.params.roomId }).populate(
      "creator"
    );
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (!room.creator?.accessToken)
      return res.status(400).json({ message: "Creator token not available." });

    const userOctokit = new Octokit({ auth: room.creator.accessToken });
    let [owner, repo] = new URL(room.repoUrl).pathname.slice(1).split("/");
    if (repo.endsWith(".git")) repo = repo.slice(0, -4);

    // Use listCommits to get multiple commits for the specified branch
    const { data } = await userOctokit.repos.listCommits({
      owner,
      repo,
      sha: branch, // The branch name
      per_page: 5, // Get the last 5 commits
    });

    const commitsData = data.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author.name,
      date: commit.commit.author.date,
      avatar: commit.author ? commit.author.avatar_url : null,
    }));

    res.status(200).json(commitsData);
  } catch (err) {
    console.error("GET_REPO_COMMITS_ERROR:", err);
    res.status(500).json({ message: "Error fetching commits from GitHub." });
  }
};

const getRepoBranches = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId }).populate(
      "creator"
    );
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (!room.creator?.accessToken)
      return res.status(400).json({ message: "Creator token not available." });

    const userOctokit = new Octokit({ auth: room.creator.accessToken });
    let [owner, repo] = new URL(room.repoUrl).pathname.slice(1).split("/");
    if (repo.endsWith(".git")) repo = repo.slice(0, -4);

    const { data } = await userOctokit.repos.listBranches({ owner, repo });
    res.status(200).json(data.map((branch) => branch.name));
  } catch (err) {
    console.error("GET_REPO_BRANCHES_ERROR:", err);
    res.status(500).json({ message: "Error fetching branches." });
  }
};

// NEW FUNCTION to get rooms for the logged-in user
const getUserRooms = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "joinedRooms",
      "roomId repoUrl"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user.joinedRooms);
  } catch (err) {
    console.error("getUserRooms error:", err);
    res.status(500).json({ message: "Error fetching user rooms." });
  }
};

module.exports = {
  createRoom,
  joinRoom,
  getRepoCommits,
  getUserRooms,
  getRepoBranches,
};
