import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import LibraryModel from "@/models/Library";
import { libraryDetails } from "@/lib/mock-data";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const library = await LibraryModel.findById(params.id)
      .populate("ownerId", "name phone email")
      .lean();

    if (!library) {
      return NextResponse.json({ error: "Library not found." }, { status: 404 });
    }

    return NextResponse.json({ library });
  } catch (err) {
    const isMissingUri =
      err instanceof Error && err.message.includes("MONGODB_URI");
    const isMongoErr = err instanceof mongoose.Error || isMissingUri;

    if (isMongoErr || !process.env.MONGODB_URI) {
      const mock = libraryDetails[params.id] ?? null;
      if (!mock) {
        return NextResponse.json({ error: "Library not found." }, { status: 404 });
      }
      return NextResponse.json({ library: mock });
    }

    console.error("[library GET]", err);
    return NextResponse.json({ error: "Failed to fetch library." }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const body = await req.json();
    const library = await LibraryModel.findByIdAndUpdate(
      params.id,
      { ...body },
      { new: true, runValidators: true }
    );

    if (!library) {
      return NextResponse.json({ error: "Library not found." }, { status: 404 });
    }

    return NextResponse.json({ library });
  } catch (err) {
    console.error("[library PUT]", err);
    return NextResponse.json({ error: "Failed to update library." }, { status: 500 });
  }
}
