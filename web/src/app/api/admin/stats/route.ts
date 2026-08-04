import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import LibraryModel from "@/models/Library";
import UserModel from "@/models/User";
import BookingModel from "@/models/Booking";
import PayoutLedgerModel from "@/models/PayoutLedger";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const twelveMonthStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [
      totalLibraries,
      verifiedLibraries,
      totalStudents,
      activeBookings,
      platformRevenueAgg,
      pendingPayouts,
      revenueChart,
      topCities,
      examDist,
    ] = await Promise.all([
      LibraryModel.countDocuments(),
      LibraryModel.countDocuments({ isVerified: true }),
      UserModel.countDocuments({ role: "STUDENT" }),
      BookingModel.countDocuments({ status: "ACTIVE" }),
      PayoutLedgerModel.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$platformShare" } } },
      ]),
      PayoutLedgerModel.countDocuments({ payoutStatus: "PENDING" }),
      // 12-month revenue line chart
      PayoutLedgerModel.aggregate([
        { $match: { createdAt: { $gte: twelveMonthStart } } },
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            total: { $sum: "$platformShare" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      // Top 10 cities by library count
      LibraryModel.aggregate([
        { $group: { _id: "$city", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      // Student exam type distribution
      UserModel.aggregate([
        { $match: { role: "STUDENT" } },
        { $group: { _id: "$examType", count: { $sum: 1 } } },
      ]),
    ]);

    const revenueMap = new Map(
      revenueChart.map((row) => [`${row._id.year}-${row._id.month}`, row.total as number])
    );
    const revenueChart12Months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      return {
        _id: { year, month },
        total: revenueMap.get(`${year}-${month}`) ?? 0,
      };
    });

    return NextResponse.json({
      totalLibraries,
      verifiedLibraries,
      totalStudents,
      activeBookings,
      platformRevenue: platformRevenueAgg[0]?.total ?? 0,
      pendingPayouts,
      revenueChart: revenueChart12Months,
      topCities,
      examDist,
    });
  } catch (err) {
    console.error("[admin/stats]", err);
    return NextResponse.json({ error: "Failed to fetch stats." }, { status: 500 });
  }
}
