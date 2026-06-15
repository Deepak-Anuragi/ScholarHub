import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import ReviewModel from "@/models/Review";
import { libraryReviews } from "@/lib/mock-data";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "5");
  const skip = (page - 1) * limit;

  try {
    await connectDB();

    const [reviews, total] = await Promise.all([
      ReviewModel.find({ libraryId: params.id })
        .populate("studentId", "name avatarUrl")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ReviewModel.countDocuments({ libraryId: params.id }),
    ]);

    return NextResponse.json({
      reviews,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    const isMissingUri =
      err instanceof Error && err.message.includes("MONGODB_URI");
    const isMongoErr = err instanceof mongoose.Error || isMissingUri;

    if (isMongoErr || !process.env.MONGODB_URI) {
      const all = libraryReviews[params.id] ?? [];
      const paginated = all.slice(skip, skip + limit);
      return NextResponse.json({
        reviews: paginated,
        total: all.length,
        page,
        totalPages: Math.max(1, Math.ceil(all.length / limit)),
      });
    }

    console.error("[reviews GET]", err);
    return NextResponse.json({ error: "Failed to fetch reviews." }, { status: 500 });
  }
}
