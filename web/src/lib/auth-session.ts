import { cookies } from "next/headers";

import type { AuthUser, UserRole } from "./auth";
import { SESSION_COOKIE } from "./auth";

type SessionPayload = AuthUser;

function decodeSession(value: string): SessionPayload | null {
  try {
    let raw = value;
    try {
      raw = decodeURIComponent(value);
    } catch {
      // ignore URI decode error
    }
    raw = raw.replace(/^"|"$/g, "").trim();
    if (!raw) return null;

    let json = "";
    try {
      json = Buffer.from(raw, "base64url").toString("utf-8");
    } catch {
      json = Buffer.from(raw, "base64").toString("utf-8");
    }

    let parsed: SessionPayload;
    try {
      parsed = JSON.parse(json) as SessionPayload;
    } catch {
      json = Buffer.from(raw, "base64").toString("utf-8");
      parsed = JSON.parse(json) as SessionPayload;
    }

    if (!parsed.id || !parsed.email || !parsed.role) return null;

    const roleLower = String(parsed.role).toLowerCase();
    const roleMap: Record<string, UserRole> = {
      admin: "admin",
      owner: "owner",
      library_owner: "owner",
      student: "student",
    };

    const role = roleMap[roleLower] || "student";

    return {
      ...parsed,
      role,
    };
  } catch {
    return null;
  }
}

/**
 * Reads and decodes the session cookie in Next.js Server Components and
 * middleware (uses next/headers — NOT compatible with Express).
 * Used only in layout.tsx files for server-side role guards.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) return null;
  return decodeSession(session);
}

