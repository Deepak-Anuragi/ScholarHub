import { Request, Response, NextFunction } from "express";
import { decodeSession, type AuthUser } from "../lib/auth";

// Extend Express Request to carry the session user
declare global {
  namespace Express {
    interface Request {
      sessionUser?: AuthUser | null;
    }
  }
}

export function loadSession(req: Request, _res: Response, next: NextFunction): void {
  let raw = req.cookies?.scholars_session as string | undefined;
  if (!raw && req.headers.authorization?.startsWith("Bearer ")) {
    raw = req.headers.authorization.split(" ")[1];
  }
  req.sessionUser = raw ? decodeSession(raw) : null;
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.sessionUser) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.sessionUser || req.sessionUser.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

/**
 * Owner-only routes. Admins are allowed through so support can act on an
 * owner's behalf — this matches what the owner dashboard layout already does
 * on the frontend.
 *
 * Most /owner handlers scope their queries by { ownerId: session.id }, but
 * that is not authorization on its own: POST /owner/library creates a row
 * rather than querying one, so without this guard any signed-in student could
 * make themselves an owner.
 */
export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  if (
    !req.sessionUser ||
    (req.sessionUser.role !== "owner" && req.sessionUser.role !== "admin")
  ) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
