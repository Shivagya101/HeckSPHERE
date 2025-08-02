require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongo");

const roomRoutes = require("./routes/roomRoutes");
const noteRoutes = require("./routes/noteRoutes");
const roomChatRoutes = require("./routes/roomChatRoutes");
const roomFileRoutes = require("./routes/roomFileRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
require("./config/passport")(passport);

// ✅ 1. CORS for Express
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

// ✅ 2. Shared session middleware (used by Express and Socket.IO)
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    httpOnly: true,
    secure: false, // true if using HTTPS
    sameSite: "lax",
  },
});
app.use(sessionMiddleware);

// ✅ 3. Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// ✅ 4. Routes
app.use("/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/room/:roomId/note", noteRoutes);
app.use("/api/room/:roomId/chat", roomChatRoutes);
app.use("/api/room/:roomId/files", roomFileRoutes);

// ✅ 5. HTTP server + Socket.IO setup
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

// ✅ 6. Socket.IO handlers — pass sessionMiddleware to enable user auth
require("./socket/socketHandler")(io, sessionMiddleware);

// ✅ 7. Connect DB and start server
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
