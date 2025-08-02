require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");

const roomRoutes = require("./routes/roomRoutes");
const noteRoutes = require("./routes/noteRoutes");
const roomChatRoutes = require("./routes/roomChatRoutes");
const roomFileRoutes = require("./routes/roomFileRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Core room endpoints
app.use("/api/room", roomRoutes);

// Subresources
app.use("/api/room/:roomId/note", noteRoutes);
app.use("/api/room/:roomId/chat", roomChatRoutes);
app.use("/api/room/:roomId/files", roomFileRoutes);

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: { origin: "*" },
});

require("./socket/socketHandler")(io);

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
