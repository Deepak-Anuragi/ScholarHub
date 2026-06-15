import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import BookingModel from "@/models/Booking";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const id = new mongoose.Types.ObjectId(user.id);

    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    const [payments, yearlyAgg] = await Promise.all([
      BookingModel.find({ studentId: id })
        .populate("libraryId", "name city")
        .sort({ createdAt: -1 })
        .lean(),
      BookingModel.aggregate([
        {
          $match: {
            studentId: id,
            paymentStatus: "SUCCESS",
            createdAt: { $gte: startOfYear },
          },
        },
        { $group: { _id: null, total: { $sum: "$amountPaid" } } },
      ]),
    ]);

    return NextResponse.json({
      payments,
      yearlyTotal: yearlyAgg[0]?.total ?? 0,
    });
  } catch (err) {
    console.error("[student/payments]", err);
    return NextResponse.json({ error: "Failed to fetch payments." }, { status: 500 });
  }
}
