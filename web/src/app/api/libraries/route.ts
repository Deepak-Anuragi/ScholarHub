import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import LibraryModel from "@/models/Library";
import { queryLibraries, LibrarySort } from "@/lib/libraries-query";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const city        = searchParams.get("city") ?? undefined;
  const state       = searchParams.get("state") ?? undefined;
  const district    = searchParams.get("district") ?? undefined;
  const examType    = searchParams.get("exam_type") ?? undefined;
  const facilitiesRaw = searchParams.get("facilities");
  const facilities  = facilitiesRaw ? facilitiesRaw.split(",").filter(Boolean) : [];
  const minRating   = searchParams.get("min_rating");
  const feeMin      = searchParams.get("fee_min");
  const feeMax      = searchParams.get("fee_max");
  const availOnly   = searchParams.get("available_only") === "true";
  const sort        = (searchParams.get("sort") as LibrarySort | null) ?? "relevance";
  const page        = Number(searchParams.get("page") ?? "1");
  const limit       = Number(searchParams.get("limit") ?? "12");

  // --- Try MongoDB first ---
  try {
    await connectDB();

    const filter: Record<string, unknown> = { isActive: true };

    if (city)     filter.city     = { $regex: new RegExp(`^${city}$`, "i") };
    if (state)    filter.state    = { $regex: new RegExp(`^${state}$`, "i") };
    if (district) filter.district = { $regex: new RegExp(`^${district}$`, "i") };

    if (feeMin || feeMax) {
      filter.monthlyFee = {
        ...(feeMin ? { $gte: Number(feeMin) } : {}),
        ...(feeMax ? { $lte: Number(feeMax) } : {}),
      };
    }

    if (minRating) filter.ratingAvg = { $gte: Number(minRating) };
    if (availOnly) filter.availableSeats = { $gt: 0 };

    // Map URL exam_type slug → stored label  e.g. "govt-exam" → "Govt Exam"
    const EXAM_TYPE_MAP: Record<string, string> = {
      "govt-exam":     "Govt Exam",
      "entrance-exam": "Entrance Exam",
      "school":        "School",
      "professional":  "Professional",
    };
    if (examType) {
      const label = EXAM_TYPE_MAP[examType] ?? examType;
      filter.studentTypes = label;
    }

    if (facilities.length > 0) {
      filter.facilities = { $all: facilities };
    }

    // Sort mapping
    const sortMap: Record<LibrarySort, Record<string, 1 | -1>> = {
      relevance:  { ratingAvg: -1, reviewCount: -1 },
      rating:     { ratingAvg: -1 },
      "fee-asc":  { monthlyFee: 1 },
      "fee-desc": { monthlyFee: -1 },
      newest:     { createdAt: -1 },
      seats:      { availableSeats: -1 },
    };

    const sortObj = sortMap[sort] ?? sortMap.relevance;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      LibraryModel.find(filter)
        .populate("ownerId", "name phone email")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      LibraryModel.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({ libraries: docs, total, page, totalPages });
  } catch (err) {
    // If MongoDB is not yet configured (e.g. MONGODB_URI missing or Atlas not set up),
    // fall back to mock data so the UI keeps working during development.
    const isMissingUri =
      err instanceof Error && err.message.includes("MONGODB_URI");
    const isMongoErr = err instanceof mongoose.Error || isMissingUri;

    if (isMongoErr || process.env.MONGODB_URI === undefined) {
      console.warn("[libraries] MongoDB unavailable — falling back to mock data");

      const result = queryLibraries({
        city,
        state,
        district,
        exam_type: examType,
        fee_min: feeMin ? Number(feeMin) : undefined,
        fee_max: feeMax ? Number(feeMax) : undefined,
        facilities: facilities.length > 0 ? facilities : undefined,
        min_rating: minRating ? Number(minRating) : undefined,
        available_only: availOnly,
        sort,
        page,
        limit,
      });

      return NextResponse.json(result);
    }

    console.error("[libraries]", err);
    return NextResponse.json({ error: "Failed to fetch libraries." }, { status: 500 });
  }
}

// POST — library owner creates a new library
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    if (!body.ownerId || !body.name || !body.address || !body.city) {
      return NextResponse.json(
        { error: "ownerId, name, address, and city are required." },
        { status: 400 }
      );
    }

    const library = await LibraryModel.create(body);
    return NextResponse.json({ library }, { status: 201 });
  } catch (err) {
    console.error("[libraries POST]", err);
    return NextResponse.json({ error: "Failed to create library." }, { status: 500 });
  }
}
