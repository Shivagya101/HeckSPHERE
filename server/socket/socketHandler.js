const jwt = require("jsonwebtoken");
const Note = require("../models/Note");
const ChatMessage = require("../models/ChatMessage");

// In-memory timer state per room
const roomTimers = {}; // { [roomId]: { remainingSeconds, active, interval } }

const broadcastTimer = (io, roomId) => {
  const state = roomTimers[roomId];
  if (!state) return;
  io.to(roomId).emit("timer:update", {
    time: state.remainingSeconds,
    active: state.active,
  });
};

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided."));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (!payload.username || !payload.roomId)
        return next(new Error("Invalid token payload."));
      socket.roomId = payload.roomId;
      socket.username = payload.username;
      next();
    } catch (e) {
      next(new Error("Invalid token."));
    }
  });

  io.on("connection", (socket) => {
    const { roomId, username } = socket;
    if (!roomId) return;

    socket.join(roomId);

    io.to(roomId).emit("chat:message", {
      from: "System",
      text: `${username} joined the room.`,
      timestamp: Date.now(),
    });

    (async () => {
      try {
        let note = await Note.findOne({ roomId });
        if (!note) {
          note = await Note.create({ roomId });
        }
        socket.emit("notes:init", {
          content: note.content,
          lastEditor: note.lastEditor,
          updatedAt: note.updatedAt,
        });
      } catch (e) {
        console.error("Error loading note on connect:", e);
      }
    })();

    socket.on("notes:update", async (newContent) => {
      try {
        const now = Date.now();
        await Note.findOneAndUpdate(
          { roomId },
          { content: newContent, lastEditor: username, updatedAt: now },
          { upsert: true, new: true }
        );
        io.to(roomId).emit("notes:update", {
          content: newContent,
          from: username,
          updatedAt: now,
        });
      } catch (e) {
        console.error("notes:update error:", e);
      }
    });

    socket.on("chat:message", async ({ text }) => {
      if (!text || typeof text !== "string") return;
      const msg = {
        from: username,
        text,
        timestamp: Date.now(),
      };
      try {
        await ChatMessage.create({
          roomId,
          from: username,
          text,
        });
      } catch (e) {
        console.error("Failed to save chat message:", e);
      }
      io.to(roomId).emit("chat:message", msg);
    });

    socket.on("timer:start", ({ duration }) => {
      if (typeof duration !== "number") return;
      if (roomTimers[roomId]?.interval)
        clearInterval(roomTimers[roomId].interval);
      roomTimers[roomId] = {
        remainingSeconds: duration,
        active: true,
        interval: null,
      };
      roomTimers[roomId].interval = setInterval(() => {
        const state = roomTimers[roomId];
        if (!state || !state.active) return;
        if (state.remainingSeconds <= 0) {
          state.active = false;
          clearInterval(state.interval);
          broadcastTimer(io, roomId);
          return;
        }
        state.remainingSeconds -= 1;
        broadcastTimer(io, roomId);
      }, 1000);
      broadcastTimer(io, roomId);
    });

    socket.on("timer:pause", () => {
      const state = roomTimers[roomId];
      if (!state) return;
      state.active = false;
      if (state.interval) clearInterval(state.interval);
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
        timestamp: Date.now(),
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
