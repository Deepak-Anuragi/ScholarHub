import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import LibraryModel from "@/models/Library";
import PayoutLedgerModel from "@/models/PayoutLedger";
import { getSessionUser } from "@/lib/auth-session";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const { searchParams } = req.nextUrl;
    const mode = searchParams.get("mode");
    const state = searchParams.get("state");
    const district = searchParams.get("district");
    const city  = searchParams.get("city");

    if (mode === "filters") {
      const districtFilter: Record<string, string> = {};
      if (state) districtFilter.state = state;

      const cityFilter: Record<string, string> = {};
      if (state) cityFilter.state = state;
      if (district) cityFilter.district = district;

      const [states, districts, cities] = await Promise.all([
        LibraryModel.distinct("state"),
        state ? LibraryModel.distinct("district", districtFilter) : Promise.resolve([]),
        state && district ? LibraryModel.distinct("city", cityFilter) : Promise.resolve([]),
      ]);

      return NextResponse.json({
        states: states.filter(Boolean).sort(),
        districts: districts.filter(Boolean).sort(),
        cities: cities.filter(Boolean).sort(),
      });
    }

    const filter: Record<string, string> = {};
    if (state) filter.state = state;
    if (district) filter.district = district;
    if (city)  filter.city  = city;

    const libraries = await LibraryModel.find(filter)
      .populate("ownerId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const revenueAgg = await PayoutLedgerModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          libraryId: { $in: libraries.map((lib) => lib._id) },
        },
      },
      { $group: { _id: "$libraryId", monthlyRevenue: { $sum: "$totalAmount" } } },
    ]);
    const revenueMap = new Map(
      revenueAgg.map((row) => [String(row._id), row.monthlyRevenue as number])
    );

    // Serialize _id fields as strings
    const serialized = libraries.map((lib) => ({
      ...lib,
      _id: String(lib._id),
      monthlyRevenue: revenueMap.get(String(lib._id)) ?? 0,
      ownerId:
        lib.ownerId && typeof lib.ownerId === "object"
          ? { ...(lib.ownerId as Record<string, unknown>), _id: String((lib.ownerId as { _id: unknown })._id) }
          : lib.ownerId,
    }));

    return NextResponse.json({ libraries: serialized });
  } catch (err) {
    console.error("[admin/libraries GET]", err);
    return NextResponse.json({ error: "Failed to fetch libraries." }, { status: 500 });
  }
}

// Bulk actions: { action: 'verify'|'suspend', ids: string[] }
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const { action, ids } = (await req.json()) as {
      action: "verify" | "suspend";
      ids: string[];
    };

    const update =
      action === "verify"
        ? { isVerified: true }
        : { isActive: false };

    const result = await LibraryModel.updateMany(
      { _id: { $in: ids } },
      update
    );

    return NextResponse.json({ modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error("[admin/libraries PATCH]", err);
    return NextResponse.json({ error: "Bulk update failed." }, { status: 500 });
  }
}
