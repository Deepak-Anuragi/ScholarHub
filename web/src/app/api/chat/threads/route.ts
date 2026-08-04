import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import MessageModel from "@/models/Message";
import UserModel from "@/models/User";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const myId = new mongoose.Types.ObjectId(session.id);

    // Aggregate unique conversation threads with last message
    const threads = await MessageModel.aggregate([
      {
        $match: {
          $or: [{ senderId: myId }, { receiverId: myId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $lt: ["$senderId", "$receiverId"] },
              { a: "$senderId", b: "$receiverId" },
              { a: "$receiverId", b: "$senderId" },
            ],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$receiverId", myId] }, { $eq: ["$isRead", false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);

    // Populate the other user's profile
    const enriched = await Promise.all(
      threads.map(async (t) => {
        const otherId =
          String(t.lastMessage.senderId) === session.id
            ? t.lastMessage.receiverId
            : t.lastMessage.senderId;

        const other = await UserModel.findById(otherId)
          .select("name avatarUrl role")
          .lean();

        return {
          threadId: String(t._id.a) + "_" + String(t._id.b),
          otherId: String(otherId),
          otherUser: other
            ? { ...other, _id: String((other as { _id: unknown })._id) }
            : null,
          lastMessage: {
            ...t.lastMessage,
            _id: String(t.lastMessage._id),
            senderId: String(t.lastMessage.senderId),
            receiverId: String(t.lastMessage.receiverId),
          },
          unreadCount: t.unreadCount,
        };
      })
    );

    return NextResponse.json({ threads: enriched });
  } catch (err) {
    console.error("[chat/threads]", err);
    return NextResponse.json({ error: "Failed to fetch threads." }, { status: 500 });
  }
}
