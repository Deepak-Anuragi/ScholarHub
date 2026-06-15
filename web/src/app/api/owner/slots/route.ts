import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import LibraryModel from "@/models/Library";
import SlotModel from "@/models/Slot";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id }).lean();
    if (!library) return NextResponse.json({ slots: [] });

    const slots = await SlotModel.find({ libraryId: library._id }).lean();
    return NextResponse.json({ slots });
  } catch (err) {
    console.error("[owner/slots GET]", err);
    return NextResponse.json({ error: "Failed to fetch slots." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id });
    if (!library) return NextResponse.json({ error: "Library not found." }, { status: 404 });

    const { name, startTime, endTime, totalSeats } = (await req.json()) as {
      name: string;
      startTime: string;
      endTime: string;
      totalSeats: number;
    };

    const slot = await SlotModel.create({
      libraryId: library._id,
      name,
      startTime,
      endTime,
      totalSeats,
      availableSeats: totalSeats,
    });

    return NextResponse.json({ slot }, { status: 201 });
  } catch (err) {
    console.error("[owner/slots POST]", err);
    return NextResponse.json({ error: "Failed to create slot." }, { status: 500 });
  }
}
