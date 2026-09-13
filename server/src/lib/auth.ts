export type UserRole = "student" | "owner" | "admin";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
};

export const SESSION_COOKIE = "scholars_session";

export function encodeSession(user: AuthUser): string {
  return Buffer.from(JSON.stringify(user)).toString("base64url");
}

export function decodeSession(value: string): AuthUser | null {
  try {
    let raw = value;
    try {
      raw = decodeURIComponent(value);
    } catch {
      // ignore
    }
    raw = raw.replace(/^"|"$/g, "").trim();
    if (!raw) return null;

    let json = "";
    try {
      json = Buffer.from(raw, "base64url").toString("utf-8");
    } catch {
      json = Buffer.from(raw, "base64").toString("utf-8");
    }

    let parsed: AuthUser;
    try {
      parsed = JSON.parse(json) as AuthUser;
    } catch {
      json = Buffer.from(raw, "base64").toString("utf-8");
      parsed = JSON.parse(json) as AuthUser;
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

