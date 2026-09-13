import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

export type UserRole = "student" | "owner" | "admin";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
};

export const SESSION_COOKIE = "scholars_session";

const ROLES: readonly UserRole[] = ["student", "owner", "admin"];

// Sessions are signed, so a missing secret is a fatal misconfiguration, not a
// condition to degrade past. Falling back to a default would be the same
// vulnerability with extra steps.
const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error(
    "JWT_SECRET is not set — refusing to start because sessions cannot be signed. " +
      "Add JWT_SECRET to server/.env (see server/.env.example)."
  );
}
const JWT_SECRET: string = SECRET;

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ??
  "30d") as SignOptions["expiresIn"];

export function encodeSession(user: AuthUser): string {
  const payload: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function decodeSession(value: string): AuthUser | null {
  try {
    const payload = jwt.verify(value, JWT_SECRET) as JwtPayload &
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
    // Covers bad signature, malformed token and expiry alike.
    return null;
  }
}

/**
 * Cookie lifetime derived from the token's own `exp` claim, so the cookie can
 * never outlive the signature it carries — otherwise the browser keeps sending
 * a token the server has already stopped accepting.
 */
export function sessionMaxAgeMs(token: string): number {
  const decoded = jwt.decode(token) as JwtPayload | null;
  if (!decoded?.exp) return 0;
  return Math.max(0, decoded.exp * 1000 - Date.now());
}
