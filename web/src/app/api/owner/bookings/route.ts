import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import LibraryModel from "@/models/Library";
import BookingModel from "@/models/Booking";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id }).lean();
    if (!library) return NextResponse.json({ bookings: [] });

    const libId = new mongoose.Types.ObjectId(String(library._id));

    const bookings = await BookingModel.find({ libraryId: libId })
      .populate("studentId", "name email phone avatarUrl")
      .populate("slotId", "name startTime endTime")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ bookings });
  } catch (err) {
    console.error("[owner/bookings]", err);
    return NextResponse.json({ error: "Failed to fetch bookings." }, { status: 500 });
  }
}
