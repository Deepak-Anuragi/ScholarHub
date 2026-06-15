import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import BookingModel from "@/models/Booking";
import { getSessionUser } from "@/lib/auth-session";
import mongoose from "mongoose";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const id = new mongoose.Types.ObjectId(user.id);

    const [active, past] = await Promise.all([
      BookingModel.find({ studentId: id, status: "ACTIVE" })
        .populate("libraryId", "name address city photos contactPhone")
        .populate("slotId", "name startTime endTime")
        .sort({ createdAt: -1 })
        .lean(),
      BookingModel.find({ studentId: id, status: { $in: ["EXPIRED", "CANCELLED"] } })
        .populate("libraryId", "name address city")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    return NextResponse.json({ active, past });
  } catch (err) {
    console.error("[student/bookings]", err);
    return NextResponse.json({ error: "Failed to fetch bookings." }, { status: 500 });
  }
}
