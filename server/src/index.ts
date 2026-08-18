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

const app = express();
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

// ── Health check ───────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 404 fallback ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Scholar's Hub API server`);
  console.log(`   Listening at  http://localhost:${PORT}`);
  console.log(`   Allowed origins: ${allowedOrigins.join(", ")}`);
  console.log(`   Environment   ${process.env.NODE_ENV ?? "development"}\n`);
});

export default app;
