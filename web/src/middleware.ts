import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware — SSR route protection for dashboard pages.
 *
 * Checks for the scholars_session cookie (set by Express as httpOnly).
 * If a protected route is accessed without a session, the user is
 * redirected to /auth/login.
 *
 * Fine-grained role checks are done in each dashboard's layout.tsx
 * via getSessionUser() from lib/auth-session.ts.
 */

const SESSION_COOKIE = "scholars_session";

// Routes that require authentication (any role)
const PROTECTED_PREFIXES = ["/admin", "/owner", "/student"];

// Routes always accessible without a session
const PUBLIC_PREFIXES = [
  "/auth",
  "/libraries",
  "/library",
  "/map",
  "/api",
  "/_next",
  "/favicon",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip public paths
  const isPublic = PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
  if (isPublic) return NextResponse.next();

  // Root is public
  if (pathname === "/") return NextResponse.next();

  // Check whether this path needs protection
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
  if (!isProtected) return NextResponse.next();

  // Check for session cookie
  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (!session) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes except Next.js internals and static files.
     * The middleware function above handles the actual filtering.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
