import { cookies } from "next/headers";
import jwt, { type JwtPayload } from "jsonwebtoken";

import type { AuthUser, UserRole } from "./auth";
import { SESSION_COOKIE } from "./auth";

const ROLES: readonly UserRole[] = ["student", "owner", "admin"];

/**
 * Server-only. `JWT_SECRET` must match the value the Express server signs with
 * (server/.env) — this module only ever verifies, never mints, tokens.
 * Deliberately NOT prefixed NEXT_PUBLIC_: it must never reach the browser.
 */
const JWT_SECRET = process.env.JWT_SECRET;

function verifySession(token: string): AuthUser | null {
  if (!JWT_SECRET) {
    // Fail closed. An unverifiable token is treated as no session at all,
    // which sends the visitor to /auth/login rather than through the guard.
    console.error(
      "[auth-session] JWT_SECRET is not set — cannot verify the session cookie."
    );
    return null;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload &
      Partial<AuthUser>;

    if (!payload.id || !payload.email || !payload.role) return null;
    if (!ROLES.includes(payload.role)) return null;

    return {
      id: payload.id,
      name: payload.name ?? "",
      email: payload.email,
      role: payload.role,
      ...(payload.avatarUrl ? { avatarUrl: payload.avatarUrl } : {}),
    };
  } catch {
    // Bad signature, malformed token, or expired.
    return null;
  }
}

/**
 * Reads and verifies the session cookie in Next.js Server Components
 * (uses next/headers — NOT compatible with Express).
 * Used by the dashboard layout.tsx files for server-side role guards.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) return null;
  return verifySession(session);
}
