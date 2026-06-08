import { NextRequest, NextResponse } from "next/server";

import { getCities, getDistricts, getStates } from "@/lib/locations";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const state = searchParams.get("state") ?? undefined;
  const district = searchParams.get("district") ?? undefined;

  if (state && district) {
    return NextResponse.json({ cities: getCities(state, district) });
  }

  if (state) {
    return NextResponse.json({ districts: getDistricts(state) });
  }

  return NextResponse.json({ states: getStates() });
}
