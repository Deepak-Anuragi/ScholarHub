import { Router, Request, Response } from "express";
import bcryptjs from "bcryptjs";
import { z } from "zod";

import connectDB from "../lib/mongodb";
import UserModel from "../models/User";
import LibraryModel from "../models/Library";
import {
  SESSION_COOKIE,
  encodeSession,
  decodeSession,
  sessionMaxAgeMs,
  type AuthUser,
} from "../lib/auth";

const router = Router();

// ── Validation helpers ─────────────────────────────────────────────────────

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(15, "Password must be at most 15 characters")
  .regex(/^\S+$/, "Password must not contain spaces")
  .regex(/[A-Z]/, "At least one uppercase letter required")
  .regex(/[a-z]/, "At least one lowercase letter required")
  .regex(/[0-9]/, "At least one number required")
  .regex(
    /[!@#$%^&*()\-_=+[\]{}|;':",.<>?/\\`~]/,
    "At least one special character required"
  );

const emailSchema = z
  .string()
  .regex(/^[a-zA-Z]/, "Email must start with a letter")
  .email("Invalid email format")
  .regex(/@[^@]+\.[^@]+$/, "Email domain must contain a dot")
  .transform((v: string) => v.toLowerCase().trim());

const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be at most 50 characters")
  .regex(/^[a-zA-Z][a-zA-Z\s.\-]*$/, "Invalid name format")
  .refine((v: string) => !/\d/.test(v), "Name cannot contain numbers")
  .transform((v: string) => v.trim());

const phoneSchema = z
  .string()
  .regex(/^\d{10}$/, "Must be exactly 10 digits")
  .regex(/^[6-9]/, "Must start with 6, 7, 8, or 9");

function formatErrors(error: z.ZodError) {
  return error.flatten().fieldErrors;
}

/** Map DB role (uppercase) → session role (lowercase) */
function toSessionRole(dbRole: string): AuthUser["role"] {
  if (dbRole === "LIBRARY_OWNER") return "owner";
  if (dbRole === "ADMIN") return "admin";
  return "student";
}

function setSessionCookie(res: Response, user: AuthUser) {
  const token = encodeSession(user);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Tied to the token's own expiry so the two can never drift apart.
    maxAge: sessionMaxAgeMs(token),
  });
}

// ── POST /api/auth/signup/student ──────────────────────────────────────────
router.post("/signup/student", async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = z.object({
      name:       nameSchema,
      email:      emailSchema,
      phone:      phoneSchema,
      password:   passwordSchema,
      city:       z.string().min(2).max(50).transform((v: string) => v.trim()),
      state:      z.string().min(2).max(50).transform((v: string) => v.trim()),
      examType:   z.enum(["UPSC", "JEE", "NEET", "SSC", "BANKING", "BOARD", "ENTRANCE", "OTHER"]),
      targetYear: z.number().int().optional(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, errors: formatErrors(result.error) });
      return;
    }

    const { name, email, phone, password, city, state, examType, targetYear } = result.data;

    await connectDB();

    const [emailExists, phoneExists] = await Promise.all([
      UserModel.findOne({ email }),
      UserModel.findOne({ phone }),
    ]);

    if (emailExists) {
      res.status(409).json({
        success: false,
        errors: { email: ["An account with this email already exists."] },
      });
      return;
    }
    if (phoneExists) {
      res.status(409).json({
        success: false,
        errors: { phone: ["This phone number is already registered."] },
      });
      return;
    }

    const passwordHash = await bcryptjs.hash(password, 12);
    const dbUser = await UserModel.create({
      name, email, phone, passwordHash,
      role: "STUDENT", city, state,
      examType, targetYear: targetYear ?? null,
      isActive: true,
    });

    const sessionUser: AuthUser = {
      id:        String(dbUser._id),
      name:      dbUser.name,
      email:     dbUser.email,
      role:      "student",
      avatarUrl: dbUser.avatarUrl,
    };

    setSessionCookie(res, sessionUser);
    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      user: sessionUser,
    });
  } catch (err) {
    console.error("[signup/student]", err);
    res.status(500).json({
      success: false,
      errors: { general: ["Something went wrong. Please try again."] },
    });
  }
});

// ── POST /api/auth/signup/owner ────────────────────────────────────────────
router.post("/signup/owner", async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = z.object({
      name:        nameSchema,
      email:       emailSchema,
      phone:       phoneSchema,
      password:    passwordSchema,
      libraryName: z.string().min(3).max(100).transform((v: string) => v.trim()),
      city:        z.string().min(2).max(50).transform((v: string) => v.trim()),
      state:       z.string().min(2).max(50).transform((v: string) => v.trim()),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, errors: formatErrors(result.error) });
      return;
    }

    const { name, email, phone, password, libraryName, city, state } = result.data;

    await connectDB();

    const [emailExists, phoneExists] = await Promise.all([
      UserModel.findOne({ email }),
      UserModel.findOne({ phone }),
    ]);

    if (emailExists) {
      res.status(409).json({
        success: false,
        errors: { email: ["An account with this email already exists."] },
      });
      return;
    }
    if (phoneExists) {
      res.status(409).json({
        success: false,
        errors: { phone: ["This phone number is already registered."] },
      });
      return;
    }

    const passwordHash = await bcryptjs.hash(password, 12);
    const dbUser = await UserModel.create({
      name, email, phone, passwordHash,
      role: "LIBRARY_OWNER", city, state,
      isActive: true,
    });

    // Create a placeholder library so the owner has something to complete
    await LibraryModel.create({
      ownerId:        dbUser._id,
      name:           libraryName,
      address:        "TBD",
      city,
      district:       "TBD",
      state,
      pincode:        "000000",
      totalSeats:     0,
      availableSeats: 0,
      monthlyFee:     0,
      facilities:     [],
      studentTypes:   [],
      photos:         [],
      isVerified:     false,
      isActive:       false, // inactive until profile is completed
    });

    const sessionUser: AuthUser = {
      id:        String(dbUser._id),
      name:      dbUser.name,
      email:     dbUser.email,
      role:      "owner",
      avatarUrl: dbUser.avatarUrl,
    };

    setSessionCookie(res, sessionUser);
    res.status(201).json({
      success: true,
      message: "Account created! Please complete your library profile.",
      user: sessionUser,
    });
  } catch (err) {
    console.error("[signup/owner]", err);
    res.status(500).json({
      success: false,
      errors: { general: ["Something went wrong. Please try again."] },
    });
  }
});

// ── POST /api/auth/signup/admin ────────────────────────────────────────────
router.post("/signup/admin", async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = z.object({
      name:        nameSchema,
      email:       emailSchema,
      phone:       phoneSchema,
      password:    passwordSchema,
      adminSecret: z.string().min(1, "Admin secret is required"),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, errors: formatErrors(result.error) });
      return;
    }

    const { name, email, phone, password, adminSecret } = result.data;

    if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
      res.status(403).json({
        success: false,
        errors: { adminSecret: ["Invalid admin authorization key."] },
      });
      return;
    }

    await connectDB();

    const [emailExists, phoneExists] = await Promise.all([
      UserModel.findOne({ email }),
      UserModel.findOne({ phone }),
    ]);

    if (emailExists) {
      res.status(409).json({
        success: false,
        errors: { email: ["An account with this email already exists."] },
      });
      return;
    }
    if (phoneExists) {
      res.status(409).json({
        success: false,
        errors: { phone: ["This phone number is already registered."] },
      });
      return;
    }

    const passwordHash = await bcryptjs.hash(password, 12);
    const dbUser = await UserModel.create({
      name, email, phone, passwordHash,
      role: "ADMIN", isActive: true,
    });

    const sessionUser: AuthUser = {
      id:    String(dbUser._id),
      name:  dbUser.name,
      email: dbUser.email,
      role:  "admin",
    };

    setSessionCookie(res, sessionUser);
    res.status(201).json({
      success: true,
      message: "Admin account created successfully.",
      user: sessionUser,
    });
  } catch (err) {
    console.error("[signup/admin]", err);
    res.status(500).json({
      success: false,
      errors: { general: ["Something went wrong. Please try again."] },
    });
  }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = z.object({
      email:    emailSchema,
      password: z.string().min(1, "Password is required"),
      role:     z.enum(["admin", "owner", "student"]),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, errors: formatErrors(result.error) });
      return;
    }

    const { email, password, role } = result.data;

    // Map frontend role → DB role for lookup
    const dbRole =
      role === "owner" ? "LIBRARY_OWNER" : role === "admin" ? "ADMIN" : "STUDENT";

    await connectDB();
    const dbUser = await UserModel.findOne({ email, role: dbRole }).select("+passwordHash");

    if (!dbUser) {
      res.status(401).json({
        success: false,
        errors: {
          general: ["No account found with this email and role. Please check your details or sign up."],
        },
      });
      return;
    }

    const isMatch = await bcryptjs.compare(password, dbUser.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        errors: { general: ["Incorrect password. Please try again."] },
      });
      return;
    }

    const sessionUser: AuthUser = {
      id:        String(dbUser._id),
      name:      dbUser.name,
      email:     dbUser.email,
      role:      toSessionRole(dbUser.role),
      avatarUrl: dbUser.avatarUrl,
    };

    setSessionCookie(res, sessionUser);
    res.json({
      success: true,
      message: "Login successful.",
      user: sessionUser,
    });
  } catch (err) {
    console.error("[login]", err);
    res.status(500).json({
      success: false,
      errors: { general: ["Something went wrong. Please try again."] },
    });
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
router.get("/me", async (req: Request, res: Response): Promise<void> => {
  try {
    // Try reading from the cookie directly so the route works even without
    // the loadSession middleware being applied first in tests / direct calls.
    const raw = req.cookies?.scholars_session as string | undefined;
    const sessionUser = req.sessionUser ?? (raw ? decodeSession(raw) : null);

    if (!sessionUser) {
      res.status(401).json({ success: false, user: null });
      return;
    }

    res.json({ success: true, user: sessionUser });
  } catch (err) {
    console.error("[/me]", err);
    res.status(500).json({ success: false, user: null });
  }
});

// ── POST /api/auth/forgot-password ────────────────────────────────────────
router.post("/forgot-password", (_req: Request, res: Response): void => {
  // Placeholder — always returns success for security (prevents email enumeration)
  res.json({
    success: true,
    message: "If an account exists with this email, a reset link will be sent.",
  });
});

export default router;
