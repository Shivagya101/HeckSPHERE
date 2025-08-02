require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");

const roomRoutes = require("./routes/roomRoutes");
const noteRoutes = require("./routes/noteRoutes");
const roomChatRoutes = require("./routes/roomChatRoutes");
const roomFileRoutes = require("./routes/roomFileRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// --- Middleware ---
app.use(cors({ origin: process.env.CLIENT_URL })); // Simplified CORS
app.use(express.json());

// --- Routes ---
app.use("/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

// FIX THE PATHS IN THE NEXT THREE LINES
app.use("/api/rooms/:roomId/note", noteRoutes);
app.use("/api/rooms/:roomId/chat", roomChatRoutes);
app.use("/api/rooms/:roomId/files", roomFileRoutes);

// --- HTTP server & Socket.IO setup ---
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
  },
});

// Pass only `io` to the handler, as session middleware is no longer used
require("./socket/socketHandler")(io);

// --- Connect DB and start server ---
const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Mongo connected");

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server running on ${PORT}`));
  } catch (e) {
    console.error("Startup error:", e);
    process.exit(1);
  }
};

start();
