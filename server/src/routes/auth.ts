import { Router, Request, Response } from "express";
import bcryptjs from "bcryptjs";

import connectDB from "../lib/mongodb";
import UserModel from "../models/User";
import { SESSION_COOKIE, encodeSession, type AuthUser } from "../lib/auth";
import { requireAuth } from "../middleware/auth";

const router = Router();

// ── POST /api/auth/login ───────────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    await connectDB();
    const dbUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (!dbUser) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const match = await bcryptjs.compare(password, dbUser.passwordHash);
    if (!match) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const sessionUser: AuthUser = {
      id: String(dbUser._id),
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role === "LIBRARY_OWNER" ? "owner" : dbUser.role === "ADMIN" ? "admin" : "student",
      avatarUrl: dbUser.avatarUrl,
    };

    res.cookie(SESSION_COOKIE, encodeSession(sessionUser), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days in ms
    });

    res.json({ user: sessionUser });
  } catch (err) {
    console.error("[login]", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ── POST /api/auth/signup ──────────────────────────────────────────────────
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, role } = req.body as {
      name?: string; email?: string; phone?: string;
      password?: string; role?: string;
    };

    if (!name || !email || !password || !phone) {
      res.status(400).json({ error: "Name, email, phone, and password are required." });
      return;
    }

    await connectDB();
    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const passwordHash = await bcryptjs.hash(password, 12);
    const dbUser = await UserModel.create({
      name, email, phone, passwordHash,
      role: role ?? "STUDENT",
    });

    const sessionUser: AuthUser = {
      id: String(dbUser._id),
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role === "LIBRARY_OWNER" ? "owner" : dbUser.role === "ADMIN" ? "admin" : "student",
    };

    res.cookie(SESSION_COOKIE, encodeSession(sessionUser), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 * 1000,
    });

    res.status(201).json({ user: sessionUser });
  } catch (err) {
    console.error("[signup]", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ── POST /api/auth/logout ──────────────────────────────────────────────────
router.post("/logout", (_req: Request, res: Response): void => {
  res.cookie(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  res.json({ success: true });
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────
router.get("/me", (req: Request, res: Response): void => {
  res.json({ user: req.sessionUser ?? null });
});

export default router;
