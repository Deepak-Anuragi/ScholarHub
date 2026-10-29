import { Router, Request, Response } from "express";
import mongoose from "mongoose";

import connectDB from "../lib/mongodb";
import PushSubscriptionModel from "../models/PushSubscription";

const router = Router();

// ── GET /api/push/vapid-public-key ──────────────────────────────────────────
router.get("/vapid-public-key", (_req: Request, res: Response): void => {
  const publicKey =
    process.env.VAPID_PUBLIC_KEY ||
    "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzk rxTuV0-1z3pQ6Dk5bT99R2m0y5W6yF7k8h4";
  res.json({ publicKey });
});

// ── POST /api/push/subscribe ───────────────────────────────────────────────
router.post("/subscribe", async (req: Request, res: Response): Promise<void> => {
  try {
    const session = req.sessionUser;
    const { subscription, userId } = req.body as {
      subscription?: {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      };
      userId?: string;
    };

    const targetUserId = session?.id || userId;
    if (!targetUserId || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      res.status(400).json({ error: "Valid subscription and userId are required." });
      return;
    }

    await connectDB();
    await PushSubscriptionModel.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        userId: new mongoose.Types.ObjectId(targetUserId),
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: "Push subscription registered." });
  } catch (err) {
    console.error("[push/subscribe POST]", err);
    res.status(500).json({ error: "Failed to register push subscription." });
  }
});

// ── POST /api/push/unsubscribe ─────────────────────────────────────────────
router.post("/unsubscribe", async (req: Request, res: Response): Promise<void> => {
  try {
    const { endpoint } = req.body as { endpoint?: string };
    if (!endpoint) {
      res.status(400).json({ error: "Endpoint is required." });
      return;
    }

    await connectDB();
    await PushSubscriptionModel.findOneAndDelete({ endpoint });
    res.json({ success: true, message: "Push subscription removed." });
  } catch (err) {
    console.error("[push/unsubscribe POST]", err);
    res.status(500).json({ error: "Failed to unsubscribe." });
  }
});

export default router;

