import { cookies } from "next/headers";

import type { AuthUser } from "./auth";
import { SESSION_COOKIE } from "./auth";

type SessionPayload = AuthUser;

function decodeSession(value: string): SessionPayload | null {
  try {
    const json = Buffer.from(value, "base64url").toString("utf-8");
    const parsed = JSON.parse(json) as SessionPayload;
    if (!parsed.id || !parsed.email || !parsed.role) return null;
    return parsed;
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
