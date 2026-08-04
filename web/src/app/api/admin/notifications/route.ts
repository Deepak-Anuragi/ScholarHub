import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import { getSessionUser } from "@/lib/auth-session";
import NotificationModel from "@/models/Notification";
import UserModel from "@/models/User";

type NotificationTarget = "ALL" | "STUDENT" | "LIBRARY_OWNER";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as {
      title?: string;
      message?: string;
      link?: string;
      target?: NotificationTarget;
    };

    if (!body.title?.trim() || !body.message?.trim()) {
      return NextResponse.json(
        { error: "Title and message are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const target = body.target ?? "ALL";
    const userFilter =
      target === "ALL" ? {} : { role: target };

    const recipients = await UserModel.find(userFilter).select("_id").lean();
    if (recipients.length === 0) {
      return NextResponse.json({ createdCount: 0 });
    }

    const docs = await NotificationModel.insertMany(
      recipients.map((recipient) => ({
        userId: recipient._id,
        type: "ADMIN_ANNOUNCEMENT",
        title: body.title!.trim(),
        message: body.message!.trim(),
        link: body.link?.trim() || undefined,
      }))
    );

    return NextResponse.json({
      createdCount: docs.length,
      notificationIds: docs.map((doc) => String(doc._id)),
    });
  } catch (err) {
    console.error("[admin/notifications POST]", err);
    return NextResponse.json(
      { error: "Failed to send notifications." },
      { status: 500 }
    );
  }
}
