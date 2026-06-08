import { NextRequest, NextResponse } from "next/server";

import {
  LibrarySort,
  queryLibraries,
} from "@/lib/libraries-query";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const facilities = searchParams.get("facilities");
  const minRating = searchParams.get("min_rating");
  const feeMin = searchParams.get("fee_min");
  const feeMax = searchParams.get("fee_max");
  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  const sort = searchParams.get("sort") as LibrarySort | null;

  const result = queryLibraries({
    city: searchParams.get("city") ?? undefined,
    state: searchParams.get("state") ?? undefined,
    district: searchParams.get("district") ?? undefined,
    exam_type: searchParams.get("exam_type") ?? undefined,
    fee_min: feeMin ? Number(feeMin) : undefined,
    fee_max: feeMax ? Number(feeMax) : undefined,
    facilities: facilities ? facilities.split(",").filter(Boolean) : undefined,
    min_rating: minRating ? Number(minRating) : undefined,
    available_only: searchParams.get("available_only") === "true",
    sort: sort ?? undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  await new Promise((resolve) => setTimeout(resolve, 300));

  return NextResponse.json(result);
}
