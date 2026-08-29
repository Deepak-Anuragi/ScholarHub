import express, { type Express } from "express";
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

/**
 * Every origin CLIENT_URL names, plus any localhost outside production.
 * Shared with the Socket.io server in index.ts so both answer the same set.
 */
export function allowedOrigins(): string[] {
  return (process.env.CLIENT_URL ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

export function isAllowedOrigin(origin: string | undefined): boolean {
  // No Origin header at all: curl, a mobile app, a same-origin server request.
  if (!origin) return true;
  const normalized = origin.replace(/\/$/, "");
  if (allowedOrigins().includes(normalized)) return true;
  return (
    process.env.NODE_ENV !== "production" &&
    (normalized.includes("localhost") || normalized.includes("127.0.0.1"))
  );
}

/**
 * The HTTP app, with no listener and no socket server attached, so tests can
 * mount the real routes instead of a replica of them.
 */
export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
      credentials: true, // required for cookies to be sent cross-origin
    })
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(cookieParser());
  app.use(loadSession); // decode scholars_session cookie into req.sessionUser

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

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}

export default createApp;
