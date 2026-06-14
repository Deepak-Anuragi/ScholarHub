import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import type { AuthUser } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/auth";
import { encodeSession } from "@/lib/auth-session";

type SignupBody = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: "STUDENT" | "LIBRARY_OWNER";
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SignupBody;

    if (!body.name || !body.email || !body.password || !body.phone) {
      return NextResponse.json(
        { error: "Name, email, phone, and password are required." },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if email already exists
    const existing = await User.findOne({ email: body.email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcryptjs.hash(body.password, 12);

    const dbUser = await User.create({
      name: body.name,
      email: body.email,
      phone: body.phone,
      passwordHash,
      role: body.role ?? "STUDENT",
    });

    const sessionUser: AuthUser = {
      id: String(dbUser._id),
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role === "LIBRARY_OWNER" ? "owner" : dbUser.role === "ADMIN" ? "admin" : "student",
    };

    const response = NextResponse.json({ user: sessionUser }, { status: 201 });

    response.cookies.set(SESSION_COOKIE, encodeSession(sessionUser), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
