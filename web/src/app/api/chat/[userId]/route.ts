import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import MessageModel from "@/models/Message";
import { getSessionUser } from "@/lib/auth-session";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const myId    = new mongoose.Types.ObjectId(session.id);
    const otherId = new mongoose.Types.ObjectId(params.userId);

    const messages = await MessageModel.find({
      $or: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId },
      ],
    })
      .populate("senderId", "name avatarUrl")
      .sort({ createdAt: 1 })
      .limit(50)
      .lean();

    // Mark received messages as read
    await MessageModel.updateMany(
      { senderId: otherId, receiverId: myId, isRead: false },
      { isRead: true }
    );

    const serialized = messages.map((m) => ({
      ...m,
      _id: String(m._id),
      senderId:
        m.senderId && typeof m.senderId === "object"
          ? { ...(m.senderId as Record<string, unknown>), _id: String((m.senderId as { _id: unknown })._id) }
          : String(m.senderId),
      receiverId: String(m.receiverId),
    }));

    return NextResponse.json({ messages: serialized });
  } catch (err) {
    console.error("[chat/userId GET]", err);
    return NextResponse.json({ error: "Failed to fetch messages." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { content, libraryId } = (await req.json()) as {
      content: string;
      libraryId?: string;
    };

    if (!content?.trim())
      return NextResponse.json({ error: "content is required" }, { status: 400 });

    const msg = await MessageModel.create({
      senderId: session.id,
      receiverId: params.userId,
      content: content.trim(),
      ...(libraryId ? { libraryId } : {}),
    });

    await msg.populate("senderId", "name avatarUrl");

    return NextResponse.json(
      {
        message: {
          ...msg.toObject(),
          _id: String(msg._id),
          senderId: {
            ...(msg.senderId as Record<string, unknown>),
            _id: String((msg.senderId as { _id: unknown })._id),
          },
          receiverId: String(msg.receiverId),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[chat/userId POST]", err);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
