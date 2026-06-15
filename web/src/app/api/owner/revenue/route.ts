import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import LibraryModel from "@/models/Library";
import BookingModel from "@/models/Booking";
import PayoutLedgerModel from "@/models/PayoutLedger";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id }).lean();
    if (!library) {
      return NextResponse.json({
        planBreakdown: [],
        monthlyChart: [],
        ledger: [],
        allTime: 0,
        thisMonth: 0,
        lastMonth: 0,
      });
    }

    const libId = new mongoose.Types.ObjectId(String(library._id));
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [planBreakdown, monthlyChart, ledger, allTimeAgg, thisMonthAgg, lastMonthAgg] =
      await Promise.all([
        BookingModel.aggregate([
          { $match: { libraryId: libId, paymentStatus: "SUCCESS" } },
          {
            $group: {
              _id: "$plan",
              revenue: { $sum: "$amountPaid" },
              count: { $sum: 1 },
            },
          },
        ]),
        BookingModel.aggregate([
          {
            $match: {
              libraryId: libId,
              paymentStatus: "SUCCESS",
              createdAt: {
                $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
              },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
              },
              revenue: { $sum: "$amountPaid" },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]),
        PayoutLedgerModel.find({ libraryId: libId })
          .populate("bookingId", "studentId plan amountPaid createdAt")
          .sort({ createdAt: -1 })
          .limit(50)
          .lean(),
        BookingModel.aggregate([
          { $match: { libraryId: libId, paymentStatus: "SUCCESS" } },
          { $group: { _id: null, total: { $sum: "$amountPaid" } } },
        ]),
        BookingModel.aggregate([
          {
            $match: {
              libraryId: libId,
              paymentStatus: "SUCCESS",
              createdAt: { $gte: startOfMonth },
            },
          },
          { $group: { _id: null, total: { $sum: "$amountPaid" } } },
        ]),
        BookingModel.aggregate([
          {
            $match: {
              libraryId: libId,
              paymentStatus: "SUCCESS",
              createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
            },
          },
          { $group: { _id: null, total: { $sum: "$amountPaid" } } },
        ]),
      ]);

    return NextResponse.json({
      planBreakdown,
      monthlyChart,
      ledger,
      allTime: allTimeAgg[0]?.total ?? 0,
      thisMonth: thisMonthAgg[0]?.total ?? 0,
      lastMonth: lastMonthAgg[0]?.total ?? 0,
    });
  } catch (err) {
    console.error("[owner/revenue]", err);
    return NextResponse.json({ error: "Failed to fetch revenue." }, { status: 500 });
  }
}
