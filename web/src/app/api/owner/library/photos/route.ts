import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import LibraryModel from "@/models/Library";
import { getSessionUser } from "@/lib/auth-session";

/** POST – push a new photo into library.photos[] */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { url, isCover = false } = (await req.json()) as {
      url: string;
      isCover?: boolean;
    };

    if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

    const library = await LibraryModel.findOne({ ownerId: user.id });
    if (!library) return NextResponse.json({ error: "Library not found." }, { status: 404 });

    const order = library.photos.length;

    await LibraryModel.findByIdAndUpdate(library._id, {
      $push: { photos: { url, isCover, order } },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[owner/photos POST]", err);
    return NextResponse.json({ error: "Failed to add photo." }, { status: 500 });
  }
}

/** DELETE – pull a photo from library.photos[] by url */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { url } = (await req.json()) as { url: string };
    if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

    const library = await LibraryModel.findOneAndUpdate(
      { ownerId: user.id },
      { $pull: { photos: { url } } },
      { new: true }
    );

    if (!library) return NextResponse.json({ error: "Library not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[owner/photos DELETE]", err);
    return NextResponse.json({ error: "Failed to delete photo." }, { status: 500 });
  }
}

/** PATCH – set cover photo or reorder */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { coverUrl } = (await req.json()) as { coverUrl: string };

    const library = await LibraryModel.findOne({ ownerId: user.id });
    if (!library) return NextResponse.json({ error: "Library not found." }, { status: 404 });

    // Mark all photos isCover:false, then set the selected one to true
    library.photos = library.photos.map((p) => ({
      ...p,
      isCover: p.url === coverUrl,
    }));
    await library.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[owner/photos PATCH]", err);
    return NextResponse.json({ error: "Failed to update cover." }, { status: 500 });
  }
}
