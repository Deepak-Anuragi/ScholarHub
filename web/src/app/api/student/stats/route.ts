import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import BookingModel from "@/models/Booking";
import ReviewModel from "@/models/Review";
import StudentCourseModel from "@/models/StudentCourse";
import NotificationModel from "@/models/Notification";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const id = new mongoose.Types.ObjectId(user.id);

    const [totalBookings, spentAgg, reviewCount, courseCount, notifications] =
      await Promise.all([
        BookingModel.countDocuments({ studentId: id, status: "ACTIVE" }),
        BookingModel.aggregate([
          { $match: { studentId: id, paymentStatus: "SUCCESS" } },
          { $group: { _id: null, total: { $sum: "$amountPaid" } } },
        ]),
        ReviewModel.countDocuments({ studentId: id }),
        StudentCourseModel.countDocuments({ studentId: id }),
        NotificationModel.find({ userId: id })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
      ]);

    return NextResponse.json({
      totalBookings,
      totalSpent: spentAgg[0]?.total ?? 0,
      reviewCount,
      courseCount,
      notifications,
    });
  } catch (err) {
    console.error("[student/stats]", err);
    return NextResponse.json({ error: "Failed to fetch stats." }, { status: 500 });
  }
}
