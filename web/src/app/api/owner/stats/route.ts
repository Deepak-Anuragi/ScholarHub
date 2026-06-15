import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import LibraryModel from "@/models/Library";
import BookingModel from "@/models/Booking";
import ReviewModel from "@/models/Review";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const library = await LibraryModel.findOne({ ownerId: user.id }).lean();
    if (!library) {
      return NextResponse.json({
        library: null,
        totalStudents: 0,
        monthlyRevenue: 0,
        pendingReviews: 0,
        monthlyChart: [],
        recentBookings: [],
      });
    }

    const libId = new mongoose.Types.ObjectId(String(library._id));
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    const [
      totalStudents,
      monthlyAgg,
      pendingReviews,
      monthlyChart,
      recentBookings,
    ] = await Promise.all([
      BookingModel.countDocuments({ libraryId: libId, status: "ACTIVE" }),
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
      ReviewModel.countDocuments({
        libraryId: libId,
        ownerReply: { $exists: false },
      }),
      // Last 6 months revenue
      BookingModel.aggregate([
        {
          $match: {
            libraryId: libId,
            paymentStatus: "SUCCESS",
            createdAt: {
              $gte: new Date(
                new Date().getFullYear(),
                new Date().getMonth() - 5,
                1
              ),
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
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      BookingModel.find({ libraryId: libId })
        .populate("studentId", "name email")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return NextResponse.json({
      library,
      totalStudents,
      monthlyRevenue: monthlyAgg[0]?.total ?? 0,
      pendingReviews,
      monthlyChart,
      recentBookings,
    });
  } catch (err) {
    console.error("[owner/stats]", err);
    return NextResponse.json({ error: "Failed to fetch stats." }, { status: 500 });
  }
}
