const Room = require("../models/Room");
const Note = require("../models/Note");
const ChatMessage = require("../models/ChatMessage");

// This wrapper function allows us to use Express middleware with Socket.IO
const wrap = (middleware) => (socket, next) =>
  middleware(socket.request, {}, next);

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

module.exports = (io, sessionMiddleware) => {
  // Use the session middleware to get user data from the main Express app
  io.use(wrap(sessionMiddleware));
  io.use(wrap(require("passport").initialize()));
  io.use(wrap(require("passport").session()));

  // New authentication middleware for sockets
  io.use(async (socket, next) => {
    const user = socket.request.user;
    const roomId = socket.handshake.query.roomId;

    if (!user) {
      return next(new Error("Unauthorized: No user is logged in."));
    }
    if (!roomId) {
      return next(new Error("No room ID provided."));
    }

    // Security Check: Verify the logged-in user is a member of the room
    const isMember = await Room.exists({ roomId, members: user._id });
    if (!isMember) {
      return next(new Error("Forbidden: You are not a member of this room."));
    }

    // Attach user and room info to the socket for later use
    socket.user = user;
    socket.roomId = roomId;
    next();
  });

  io.on("connection", (socket) => {
    // Get user info from the socket object we prepared in the middleware
    const { roomId, user } = socket;
    const username = user.username;

    socket.join(roomId);

    io.to(roomId).emit("chat:message", {
      from: "System",
      text: `${username} joined the room.`,
      timestamp: Date.now(),
    });

    // Fetch initial note content when a user joins
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
      // Broadcast to everyone else in the room
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
        if (roomTimers[roomId]?.interval) clearInterval(roomTimers[roomId].interval);
        
        roomTimers[roomId] = {
            remainingSeconds: duration,
            active: true,
            interval: setInterval(() => {
                const state = roomTimers[roomId];
                if (!state || !state.active) {
                    if (state) clearInterval(state.interval);
                    return;
                }
                if (state.remainingSeconds <= 0) {
                    state.active = false;
                    clearInterval(state.interval);
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
        if (roomTimers[roomId]?.interval) clearInterval(roomTimers[roomId].interval);
        roomTimers[roomId] = { remainingSeconds: to, active: false, interval: null };
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