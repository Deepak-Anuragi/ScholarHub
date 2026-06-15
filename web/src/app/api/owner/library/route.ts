import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import LibraryModel from "@/models/Library";
import { getSessionUser } from "@/lib/auth-session";

/** GET – fetch the owner's library */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id }).lean();

    if (!library) return NextResponse.json({ library: null });
    return NextResponse.json({ library });
  } catch (err) {
    console.error("[owner/library GET]", err);
    return NextResponse.json({ error: "Failed to fetch library." }, { status: 500 });
  }
}

/** PATCH – update basic info, fees, facilities, studentTypes */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();

    const library = await LibraryModel.findOneAndUpdate(
      { ownerId: user.id },
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!library) return NextResponse.json({ error: "Library not found." }, { status: 404 });
    return NextResponse.json({ library });
  } catch (err) {
    console.error("[owner/library PATCH]", err);
    return NextResponse.json({ error: "Failed to update library." }, { status: 500 });
  }
}

/** POST – create a new library for the owner */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const existing = await LibraryModel.findOne({ ownerId: user.id });
    if (existing) {
      return NextResponse.json(
        { error: "You already have a library. Edit it instead." },
        { status: 409 }
      );
    }

    const body = await req.json();
    const library = await LibraryModel.create({ ...body, ownerId: user.id });
    return NextResponse.json({ library }, { status: 201 });
  } catch (err) {
    console.error("[owner/library POST]", err);
    return NextResponse.json({ error: "Failed to create library." }, { status: 500 });
  }
}
