import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import CourseModel from "@/models/Course";
import StudentCourseModel from "@/models/StudentCourse";
import { getSessionUser } from "@/lib/auth-session";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const existing = await StudentCourseModel.findOne({
      studentId: user.id,
      courseId: params.id,
    });

    if (existing) {
      return NextResponse.json({ error: "Already enrolled." }, { status: 409 });
    }

    await StudentCourseModel.create({
      studentId: user.id,
      courseId: params.id,
    });

    await CourseModel.findByIdAndUpdate(params.id, {
      $inc: { enrolledCount: 1 },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[courses/enroll]", err);
    return NextResponse.json({ error: "Failed to enroll." }, { status: 500 });
  }
}
