import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { loadSession } from "./middleware/auth";

import authRoutes from "./routes/auth";
import librariesRoutes from "./routes/libraries";
import bookingsRoutes from "./routes/bookings";
import coursesRoutes from "./routes/courses";
import locationsRoutes from "./routes/locations";
import chatRoutes from "./routes/chat";
import ownerRoutes from "./routes/owner";
import studentRoutes from "./routes/student";
import adminRoutes from "./routes/admin";
import notificationsRoutes from "./routes/notifications";
import { setSocketIO } from "./lib/socket";

import http from "http";
import { Server, Socket } from "socket.io";
import { decodeSession, AuthUser } from "./lib/auth";
import connectDB from "./lib/mongodb";
import MessageModel from "./models/Message";

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT ?? 5000);
const rawClientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";

// Support comma-separated list of origins in CLIENT_URL (e.g. "https://scholarshub.in,https://www.scholarshub.in")
const allowedOrigins = rawClientUrl
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin server requests)
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/$/, "");
      if (
        allowedOrigins.includes(normalizedOrigin) ||
        (process.env.NODE_ENV !== "production" &&
          (normalizedOrigin.includes("localhost") ||
            normalizedOrigin.includes("127.0.0.1")))
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true, // required for cookies to be sent cross-origin
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(loadSession); // decode scholars_session cookie into req.sessionUser

// ── Socket.io Setup ────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/$/, "");
      if (
        allowedOrigins.includes(normalizedOrigin) ||
        (process.env.NODE_ENV !== "production" &&
          (normalizedOrigin.includes("localhost") ||
            normalizedOrigin.includes("127.0.0.1")))
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  },
});

setSocketIO(io);

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: AuthUser;
}

io.use((socket: AuthenticatedSocket, next) => {
  let token = socket.handshake.auth?.token as string | undefined;
  if (!token && socket.handshake.headers.cookie) {
    const match = socket.handshake.headers.cookie.match(/scholars_session=([^;]+)/);
    if (match) token = match[1];
  }
  if (!token) {
    return next(new Error("Authentication error"));
  }
  const decoded = decodeSession(token);
  if (!decoded) {
    return next(new Error("Authentication error"));
  }
  socket.userId = decoded.id;
  socket.user = decoded;
  next();
});

function getRoomId(a: string, b: string) {
  return [a, b].sort().join("_");
}

io.on("connection", (socket: AuthenticatedSocket) => {
  if (!socket.userId) return;

  socket.join(socket.userId);

  socket.on("join_room", (roomId: string) => {
    socket.join(roomId);
  });

  socket.on("send_message", async (data: { to: string; content: string; libraryId?: string }) => {
    try {
      if (!socket.userId || !data.to || !data.content?.trim()) return;
      await connectDB();
      const roomId = getRoomId(socket.userId, data.to);

      const msg = await MessageModel.create({
        senderId: socket.userId,
        receiverId: data.to,
        content: data.content.trim(),
        ...(data.libraryId ? { libraryId: data.libraryId } : {}),
      });

      await msg.populate("senderId", "name avatarUrl");

      const serializedMsg = {
        ...msg.toObject(),
        _id: String(msg._id),
        senderId: msg.senderId && typeof msg.senderId === "object"
          ? { ...(msg.senderId as Record<string, unknown>), _id: String((msg.senderId as { _id: unknown })._id) }
          : String(msg.senderId),
        receiverId: String(msg.receiverId),
      };

      io.to(roomId).emit("message_received", serializedMsg);
      io.to(data.to).emit("message_received", serializedMsg);
    } catch (err) {
      console.error("[socket send_message]", err);
    }
  });

  socket.on("typing", (data: { to: string }) => {
    if (!socket.userId || !data.to) return;
    const roomId = getRoomId(socket.userId, data.to);
    socket.to(roomId).emit("user_typing", { from: socket.userId });
    socket.to(data.to).emit("user_typing", { from: socket.userId });
  });

  socket.on("read_messages", async (data: { from: string }) => {
    try {
      if (!socket.userId || !data.from) return;
      await connectDB();
      await MessageModel.updateMany(
        { senderId: data.from, receiverId: socket.userId, isRead: false },
        { isRead: true }
      );
      const roomId = getRoomId(socket.userId, data.from);
      io.to(roomId).emit("messages_read", { by: socket.userId, from: data.from });
    } catch (err) {
      console.error("[socket read_messages]", err);
    }
  });
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/libraries", librariesRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/locations", locationsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationsRoutes);

// ── Health check ───────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 404 fallback ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ── Start ──────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🚀  Scholar's Hub API server with Socket.io`);
  console.log(`   Listening at  http://localhost:${PORT}`);
  console.log(`   Allowed origins: ${allowedOrigins.join(", ")}`);
  console.log(`   Environment   ${process.env.NODE_ENV ?? "development"}\n`);
});

export default app;
