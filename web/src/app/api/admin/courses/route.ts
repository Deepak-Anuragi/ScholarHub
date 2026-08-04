import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import CourseModel from "@/models/Course";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const courses = await CourseModel.find()
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      courses: courses.map((c) => ({
        ...c,
        _id: String(c._id),
        createdBy:
          c.createdBy && typeof c.createdBy === "object"
            ? {
                ...(c.createdBy as Record<string, unknown>),
                _id: String((c.createdBy as { _id: unknown })._id),
              }
            : c.createdBy
            ? String(c.createdBy)
            : null,
      })),
    });
  } catch (err) {
    console.error("[admin/courses GET]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const body = (await req.json()) as {
      title: string;
      description?: string;
      subject: string;
      examTypes: string[];
      fileUrl: string;
    };

    const course = await CourseModel.create({ ...body, createdBy: user.id });
    await course.populate("createdBy", "name");

    return NextResponse.json(
      {
        course: {
          ...course.toObject(),
          _id: String(course._id),
          createdBy:
            course.createdBy && typeof course.createdBy === "object"
              ? {
                  ...(course.createdBy as unknown as Record<string, unknown>),
                  _id: String((course.createdBy as unknown as { _id: unknown })._id),
                }
              : String(course.createdBy),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[admin/courses POST]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();
    const { id } = (await req.json()) as { id: string };
    await CourseModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/courses DELETE]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
