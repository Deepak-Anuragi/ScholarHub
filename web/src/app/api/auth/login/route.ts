import { NextResponse } from "next/server";

import type { AuthUser } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/auth";
import { encodeSession } from "@/lib/auth-session";

type LoginBody = {
  email: string;
  password: string;
  role?: AuthUser["role"];
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginBody;

  if (!body.email || !body.password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const user: AuthUser = {
    id: "demo-user",
    name: body.email.split("@")[0] ?? "Student",
    email: body.email,
    role: body.role ?? "student",
  };

  const response = NextResponse.json({ user });

  response.cookies.set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
