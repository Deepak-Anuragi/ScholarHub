import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import PayoutLedgerModel from "@/models/PayoutLedger";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const startOfMonth  = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const startOfYear   = new Date(new Date().getFullYear(), 0, 1);

    const [ledger, monthAgg, yearAgg, allTimeAgg] = await Promise.all([
      PayoutLedgerModel.find()
        .populate("libraryId", "name city")
        .populate("ownerId", "name")
        .sort({ createdAt: -1 })
        .lean(),
      PayoutLedgerModel.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, platform: { $sum: "$platformShare" }, owner: { $sum: "$ownerShare" } } },
      ]),
      PayoutLedgerModel.aggregate([
        { $match: { createdAt: { $gte: startOfYear } } },
        { $group: { _id: null, platform: { $sum: "$platformShare" }, owner: { $sum: "$ownerShare" } } },
      ]),
      PayoutLedgerModel.aggregate([
        { $group: { _id: null, platform: { $sum: "$platformShare" }, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const serialized = ledger.map((row) => ({
      ...row,
      _id: String(row._id),
      bookingId: row.bookingId ? String(row.bookingId) : null,
      libraryId:
        row.libraryId && typeof row.libraryId === "object"
          ? {
              ...(row.libraryId as Record<string, unknown>),
              _id: String((row.libraryId as { _id: unknown })._id),
            }
          : row.libraryId
          ? String(row.libraryId)
          : null,
      ownerId:
        row.ownerId && typeof row.ownerId === "object"
          ? {
              ...(row.ownerId as Record<string, unknown>),
              _id: String((row.ownerId as { _id: unknown })._id),
            }
          : row.ownerId
          ? String(row.ownerId)
          : null,
    }));

    return NextResponse.json({
      ledger: serialized,
      thisMonth:  { platform: monthAgg[0]?.platform ?? 0, owner: monthAgg[0]?.owner ?? 0 },
      thisYear:   { platform: yearAgg[0]?.platform  ?? 0, owner: yearAgg[0]?.owner  ?? 0 },
      allTime:    { platform: allTimeAgg[0]?.platform ?? 0, total: allTimeAgg[0]?.total ?? 0 },
    });
  } catch (err) {
    console.error("[admin/revenue]", err);
    return NextResponse.json({ error: "Failed to fetch revenue." }, { status: 500 });
  }
}
