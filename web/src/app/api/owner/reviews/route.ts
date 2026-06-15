import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import LibraryModel from "@/models/Library";
import ReviewModel from "@/models/Review";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id }).lean();
    if (!library) return NextResponse.json({ reviews: [] });

    const libId = new mongoose.Types.ObjectId(String(library._id));
    const reviews = await ReviewModel.find({ libraryId: libId })
      .populate("studentId", "name avatarUrl")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ reviews });
  } catch (err) {
    console.error("[owner/reviews GET]", err);
    return NextResponse.json({ error: "Failed to fetch reviews." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { reviewId, ownerReply } = (await req.json()) as {
      reviewId: string;
      ownerReply: string;
    };

    const library = await LibraryModel.findOne({ ownerId: user.id });
    if (!library) return NextResponse.json({ error: "Library not found." }, { status: 404 });

    const review = await ReviewModel.findOneAndUpdate(
      {
        _id: reviewId,
        libraryId: library._id,
      },
      { ownerReply, ownerRepliedAt: new Date() },
      { new: true }
    );

    if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
    return NextResponse.json({ review });
  } catch (err) {
    console.error("[owner/reviews PATCH]", err);
    return NextResponse.json({ error: "Failed to update review." }, { status: 500 });
  }
}
