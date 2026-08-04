import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import LibraryModel from "@/models/Library";
import { getSessionUser } from "@/lib/auth-session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;

    const library = await LibraryModel.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    if (!library)
      return NextResponse.json({ error: "Library not found." }, { status: 404 });

    return NextResponse.json({ library: { ...library.toObject(), _id: String(library._id) } });
  } catch (err) {
    console.error("[admin/library PATCH]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();
    const { id } = await params;
    await LibraryModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/library DELETE]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
