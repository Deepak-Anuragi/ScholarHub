import { Router, Request, Response } from "express";
import mongoose from "mongoose";

import connectDB from "../lib/mongodb";
import NotificationModel from "../models/Notification";
import { requireAuth } from "../middleware/auth";
import { emitNotificationCount } from "../lib/notifications";

const router = Router();
router.use(requireAuth);

// ── GET /api/notifications ────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const limit = Number(req.query.limit ?? 20);
    const notifications = await NotificationModel.find({
      userId: new mongoose.Types.ObjectId(user.id),
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ notifications });
  } catch (err) {
    console.error("[notifications GET]", err);
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
});

// ── GET /api/notifications/count ──────────────────────────────────────────
router.get("/count", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const unreadCount = await NotificationModel.countDocuments({
      userId: new mongoose.Types.ObjectId(user.id),
      isRead: false,
    });

    res.json({ unreadCount, count: unreadCount });
  } catch (err) {
    console.error("[notifications/count]", err);
    res.status(500).json({ error: "Failed to fetch notification count." });
  }
});

// ── PATCH /api/notifications/read-all ─────────────────────────────────────
router.patch("/read-all", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    await NotificationModel.updateMany(
      {
        userId: new mongoose.Types.ObjectId(user.id),
        isRead: false,
      },
      { isRead: true }
    );

    await emitNotificationCount(user.id);

    res.json({ success: true });
  } catch (err) {
    console.error("[notifications/read-all]", err);
    res.status(500).json({ error: "Failed to mark notifications as read." });
  }
});

// ── PATCH /api/notifications/:id/read ─────────────────────────────────────
router.patch("/:id/read", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const updated = await NotificationModel.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: new mongoose.Types.ObjectId(user.id),
      },
      { isRead: true },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ error: "Notification not found." });
      return;
    }

    res.json({ notification: updated });
  } catch (err) {
    console.error("[notifications/:id/read]", err);
    res.status(500).json({ error: "Failed to update notification." });
  }
});

export default router;
