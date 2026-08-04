import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getSessionUser } from "@/lib/auth-session";
import LibraryModel from "@/models/Library";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;

    const library = await LibraryModel.findByIdAndUpdate(
      id,
      { isVerified: true },
      { new: true }
    );

    if (!library) {
      return NextResponse.json({ error: "Library not found." }, { status: 404 });
    }

    return NextResponse.json({
      library: { ...library.toObject(), _id: String(library._id) },
    });
  } catch (err) {
    console.error("[admin/libraries verify]", err);
    return NextResponse.json({ error: "Failed to verify library." }, { status: 500 });
  }
}
