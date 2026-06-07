import { cookies } from "next/headers";

import type { AuthUser } from "./auth";
import { SESSION_COOKIE } from "./auth";

type SessionPayload = AuthUser;

function decodeSession(value: string): SessionPayload | null {
  try {
    const json = Buffer.from(value, "base64url").toString("utf-8");
    const parsed = JSON.parse(json) as SessionPayload;

    if (!parsed.id || !parsed.email || !parsed.role) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function encodeSession(user: SessionPayload): string {
  return Buffer.from(JSON.stringify(user)).toString("base64url");
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;

  if (!session) {
    return null;
  }

  return decodeSession(session);
}
