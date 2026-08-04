import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import UserModel from "@/models/User";
import BookingModel from "@/models/Booking";
import { getSessionUser } from "@/lib/auth-session";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const { searchParams } = req.nextUrl;
    const city     = searchParams.get("city")     ?? undefined;
    const examType = searchParams.get("examType") ?? undefined;

    const filter: Record<string, unknown> = { role: "STUDENT" };
    if (city)     filter.city     = city;
    if (examType) filter.examType = examType;

    const students = await UserModel.find(filter)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean();

    // Attach active booking for each student in one aggregation
    const studentIds = students.map((s) => s._id);
    const activeBookings = await BookingModel.find({
      studentId: { $in: studentIds },
      status: "ACTIVE",
    })
      .populate("libraryId", "name city")
      .lean();

    const bookingMap = new Map(
      activeBookings.map((b) => [String(b.studentId), b])
    );

    const result = students.map((s) => {
      const activeBooking = bookingMap.get(String(s._id));

      return {
        ...s,
        _id: String(s._id),
        activeBooking: activeBooking
          ? {
              ...activeBooking,
              _id: String(activeBooking._id),
              studentId: String(activeBooking.studentId),
              libraryId:
                activeBooking.libraryId && typeof activeBooking.libraryId === "object"
                  ? {
                      ...(activeBooking.libraryId as Record<string, unknown>),
                      _id: String((activeBooking.libraryId as { _id: unknown })._id),
                    }
                  : activeBooking.libraryId
                    ? String(activeBooking.libraryId)
                    : null,
            }
          : null,
      };
    });

    return NextResponse.json({ students: result });
  } catch (err) {
    console.error("[admin/students]", err);
    return NextResponse.json({ error: "Failed to fetch students." }, { status: 500 });
  }
}
