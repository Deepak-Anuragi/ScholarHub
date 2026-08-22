export type UserRole = "student" | "owner" | "admin";

export type AuthUser = {
  id:        string;
  name:      string;
  email:     string;
  role:      UserRole;
  avatarUrl?: string;
};

export const SESSION_COOKIE = "scholars_session";

/** Dashboard path for each role — dashboards are already built. */
export function getDashboardPath(role: UserRole | string): string {
  switch (role) {
    case "admin":   return "/admin";
    case "owner":   return "/owner";
    case "student":
    default:        return "/student";
  }
}

// ── Server-side fetch (used by /api/auth/me proxy route in auth-provider) ──

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { user: AuthUser | null };
  return data.user ?? null;
}

export async function logoutUser(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}
