import { Router, Request, Response } from "express";
import mongoose from "mongoose";

import connectDB from "../lib/mongodb";
import MessageModel from "../models/Message";
import UserModel from "../models/User";
import { requireAuth } from "../middleware/auth";

const router = Router();

// ── GET /api/chat/threads ─────────────────────────────────────────────────
router.get("/threads", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.sessionUser!;
    await connectDB();
    const myId = new mongoose.Types.ObjectId(session.id);

    const threads = await MessageModel.aggregate([
      { $match: { $or: [{ senderId: myId }, { receiverId: myId }] } },
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
              $cond: [{ $and: [{ $eq: ["$receiverId", myId] }, { $eq: ["$isRead", false] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);

    const enriched = await Promise.all(
      threads.map(async (t: any) => {
        const otherId = String(t.lastMessage.senderId) === session.id
          ? t.lastMessage.receiverId : t.lastMessage.senderId;
        const other = await UserModel.findById(otherId).select("name avatarUrl role").lean();
        return {
          threadId: String(t._id.a) + "_" + String(t._id.b),
          otherId: String(otherId),
          otherUser: other ? { ...other, _id: String((other as { _id: unknown })._id) } : null,
          lastMessage: {
            ...t.lastMessage, _id: String(t.lastMessage._id),
            senderId: String(t.lastMessage.senderId), receiverId: String(t.lastMessage.receiverId),
          },
          unreadCount: t.unreadCount,
        };
      })
    );

    res.json({ threads: enriched });
  } catch (err) {
    console.error("[chat/threads]", err);
    res.status(500).json({ error: "Failed to fetch threads." });
  }
});

// ── GET /api/chat/unread-count ────────────────────────────────────────────
router.get("/unread-count", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.sessionUser!;
    await connectDB();
    const count = await MessageModel.countDocuments({
      receiverId: new mongoose.Types.ObjectId(session.id),
      isRead: false,
    });
    res.json({ unreadCount: count });
  } catch (err) {
    console.error("[chat/unread-count]", err);
    res.status(500).json({ error: "Failed to fetch unread count." });
  }
});

// ── GET /api/chat/:userId ─────────────────────────────────────────────────
router.get("/:userId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.sessionUser!;
    await connectDB();
    const myId = new mongoose.Types.ObjectId(session.id);
    const otherId = new mongoose.Types.ObjectId(req.params.userId);

    const messages = await MessageModel.find({
      $or: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId },
      ],
    }).populate("senderId", "name avatarUrl").sort({ createdAt: 1 }).limit(50).lean();

    await MessageModel.updateMany({ senderId: otherId, receiverId: myId, isRead: false }, { isRead: true });

    const serialized = messages.map((m: any) => ({
      ...m,
      _id: String(m._id),
      senderId: m.senderId && typeof m.senderId === "object"
        ? { ...(m.senderId as Record<string, unknown>), _id: String((m.senderId as { _id: unknown })._id) }
        : String(m.senderId),
      receiverId: String(m.receiverId),
    }));

    res.json({ messages: serialized });
  } catch (err) {
    console.error("[chat/userId GET]", err);
    res.status(500).json({ error: "Failed to fetch messages." });
  }
});

// ── POST /api/chat/:userId ────────────────────────────────────────────────
router.post("/:userId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.sessionUser!;
    await connectDB();
    const { content, libraryId } = req.body as { content?: string; libraryId?: string };

    if (!content?.trim()) { res.status(400).json({ error: "content is required" }); return; }

    const msg = await MessageModel.create({
      senderId: session.id, receiverId: req.params.userId,
      content: content.trim(), ...(libraryId ? { libraryId } : {}),
    });
    await msg.populate("senderId", "name avatarUrl");

    res.status(201).json({
      message: {
        ...msg.toObject(), _id: String(msg._id),
        senderId: { ...(msg.senderId as Record<string, unknown>), _id: String((msg.senderId as { _id: unknown })._id) },
        receiverId: String(msg.receiverId),
      },
    });
  } catch (err) {
    console.error("[chat/userId POST]", err);
    res.status(500).json({ error: "Failed to send message." });
  }
});

export default router;
