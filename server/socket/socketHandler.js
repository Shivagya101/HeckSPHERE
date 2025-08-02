const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Room = require("../models/Room");
const Note = require("../models/Note");
const ChatMessage = require("../models/ChatMessage");

// In-memory timer state per room
const roomTimers = {};
const broadcastTimer = (io, roomId) => {
  const state = roomTimers[roomId];
  if (!state) return;
  io.to(roomId).emit("timer:update", {
    time: state.remainingSeconds,
    active: state.active,
  });
};

module.exports = (io) => {
  // New JWT authentication middleware for sockets
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    const roomId = socket.handshake.query.roomId;

    if (!token) {
      return next(new Error("Authentication error: No token provided."));
    }
    if (!roomId) {
      return next(new Error("No room ID provided."));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error("Authentication error: User not found."));
      }

      const isMember = await Room.exists({ roomId, members: user._id });
      if (!isMember) {
        return next(new Error("Forbidden: You are not a member of this room."));
      }

      socket.user = user;
      socket.roomId = roomId;
      next();
    } catch (e) {
      next(new Error("Authentication error: Invalid token."));
    }
  });

  io.on("connection", (socket) => {
    const { roomId, user } = socket;
    const username = user.username;

    socket.join(roomId);

    io.to(roomId).emit("chat:message", {
      from: "System",
      text: `${username} joined the room.`,
      timestamp: Date.now(),
    });

    // Fetch initial note content
    (async () => {
      const note = await Note.findOneAndUpdate(
        { roomId },
        { $setOnInsert: { roomId } },
        { upsert: true, new: true }
      );
      socket.emit("notes:init", {
        content: note.content,
        lastEditor: note.lastEditor,
      });
    })();

    // --- FULLY INTEGRATED EVENT HANDLERS ---

    socket.on("notes:update", async (newContent) => {
      await Note.updateOne(
        { roomId },
        { content: newContent, lastEditor: username }
      );
      socket.broadcast.to(roomId).emit("notes:update", {
        content: newContent,
        from: username,
      });
    });

    socket.on("chat:message", async ({ text }) => {
      if (!text || typeof text !== "string") return;
      const msg = { from: username, text, timestamp: Date.now() };
      await ChatMessage.create({ roomId, from: username, text });
      io.to(roomId).emit("chat:message", msg);
    });

    socket.on("timer:start", ({ duration }) => {
      if (typeof duration !== "number" || duration < 0) return;
      if (roomTimers[roomId]?.interval)
        clearInterval(roomTimers[roomId].interval);

      roomTimers[roomId] = {
        remainingSeconds: duration,
        active: true,
        interval: setInterval(() => {
          const state = roomTimers[roomId];
          if (!state || !state.active || state.remainingSeconds <= 0) {
            if (state) {
              state.active = false;
              clearInterval(state.interval);
            }
            broadcastTimer(io, roomId);
            return;
          }
          state.remainingSeconds -= 1;
          broadcastTimer(io, roomId);
        }, 1000),
      };
      broadcastTimer(io, roomId);
    });

    socket.on("timer:pause", () => {
      const state = roomTimers[roomId];
      if (!state) return;
      state.active = false;
      broadcastTimer(io, roomId);
    });

    socket.on("timer:reset", ({ to = 0 }) => {
      if (roomTimers[roomId]?.interval)
        clearInterval(roomTimers[roomId].interval);
      roomTimers[roomId] = {
        remainingSeconds: to,
        active: false,
        interval: null,
      };
      broadcastTimer(io, roomId);
    });

    socket.on("file:uploaded", (fileMeta) => {
      io.to(roomId).emit("file:uploaded", {
        ...fileMeta,
        uploader: username,
      });
    });

    socket.on("disconnect", () => {
      io.to(roomId).emit("chat:message", {
        from: "System",
        text: `${username} left the room.`,
        timestamp: Date.now(),
      });
    });
  });
};
