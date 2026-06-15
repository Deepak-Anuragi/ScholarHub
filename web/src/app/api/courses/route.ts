import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import CourseModel from "@/models/Course";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = req.nextUrl;
    const examType = searchParams.get("examType");

    const filter = examType && examType !== "all"
      ? { examTypes: examType }
      : {};

    const courses = await CourseModel.find(filter)
      .populate("createdBy", "name")
      .sort({ enrolledCount: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ courses });
  } catch (err) {
    console.error("[courses]", err);
    return NextResponse.json({ error: "Failed to fetch courses." }, { status: 500 });
  }
}
