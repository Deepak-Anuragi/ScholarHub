import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import StudentCourseModel from "@/models/StudentCourse";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const id = new mongoose.Types.ObjectId(user.id);

    const enrolled = await StudentCourseModel.find({ studentId: id })
      .populate("courseId")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ enrolled });
  } catch (err) {
    console.error("[student/courses]", err);
    return NextResponse.json({ error: "Failed to fetch courses." }, { status: 500 });
  }
}
