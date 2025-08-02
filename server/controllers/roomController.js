const Room = require("../models/Room");
const User = require("../models/User");
const { nanoid } = require("nanoid");
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
});

const generateUniqueRoomId = async () => {
  while (true) {
    const candidate = nanoid(8);
    const exists = await Room.findOne({ roomId: candidate });
    if (!exists) {
      return candidate;
    }
  }
};

const createRoom = async (req, res) => {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl || !repoUrl.startsWith("https://github.com/")) {
      return res
        .status(400)
        .json({ error: "A valid GitHub repository URL is required." });
    }
    const roomId = await generateUniqueRoomId();
    const newRoom = new Room({
      roomId,
      repoUrl,
      creator: req.user.id,
      members: [req.user.id],
    });
    await newRoom.save();
    await User.findByIdAndUpdate(req.user.id, {
      $push: { joinedRooms: newRoom._id },
    });
    res.status(201).json({ roomId: newRoom.roomId });
  } catch (err) {
    console.error("createRoom error:", err);
    res.status(500).json({ error: "Failed to create room." });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: "Room not found." });
    }
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

const getRepoCommits = async (req, res) => {
  try {
    const { branch } = req.query;
    if (!branch)
      return res.status(400).json({ message: "Branch name is required." });

    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });

    let [owner, repo] = new URL(room.repoUrl).pathname.slice(1).split("/");
    if (repo.endsWith(".git")) repo = repo.slice(0, -4);

    const { data } = await octokit.repos.listCommits({
      owner,
      repo,
      sha: branch,
      per_page: 5,
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
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: "Room not found." });

    let [owner, repo] = new URL(room.repoUrl).pathname.slice(1).split("/");
    if (repo.endsWith(".git")) repo = repo.slice(0, -4);

    const { data } = await octokit.repos.listBranches({ owner, repo });
    res.status(200).json(data.map((branch) => branch.name));
  } catch (err) {
    console.error("GET_REPO_BRANCHES_ERROR:", err);
    res.status(500).json({ message: "Error fetching branches." });
  }
};

const getUserRooms = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "joinedRooms",
      "roomId repoUrl"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
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
