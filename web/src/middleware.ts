import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware — cheap first-pass route protection for dashboard pages.
 *
 * This only checks that the scholars_session cookie is PRESENT. It does not
 * verify the signature: middleware runs on the Edge runtime, where the Node
 * crypto that jsonwebtoken needs is unavailable. A forged cookie gets past
 * this layer by design — it is a redirect optimisation, not a security
 * boundary.
 *
 * The real check is jwt.verify in getSessionUser() (lib/auth-session.ts),
 * called by every dashboard layout.tsx, and again by the Express server on
 * each API request. Never treat a route as protected on the strength of this
 * file alone.
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
