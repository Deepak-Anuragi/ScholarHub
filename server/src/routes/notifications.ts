import { Router, Request, Response } from "express";
import mongoose from "mongoose";

import connectDB from "../lib/mongodb";
import NotificationModel from "../models/Notification";
import BookingModel from "../models/Booking";
import LibraryModel from "../models/Library";
import UserModel from "../models/User";
import { requireAuth } from "../middleware/auth";
import { emitNotificationCount } from "../lib/notifications";

const router = Router();
router.use(requireAuth);

/**
 * Ensures that existing successful bookings always have a corresponding
 * notification in the user's feed (for both students and library owners).
 */
async function syncBookingNotifications(userId: mongoose.Types.ObjectId, role?: string): Promise<void> {
  try {
    if (role === "STUDENT" || !role) {
      const bookings = await BookingModel.find({
        studentId: userId,
        paymentStatus: "SUCCESS",
      })
        .populate("libraryId", "name")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      for (const b of bookings) {
        const libName = (b.libraryId as { name?: string } | null)?.name || "Library";
        const exists = await NotificationModel.exists({
          userId,
          type: "BOOKING_CONFIRMED",
          link: "/student/bookings",
        });

        if (!exists) {
          await NotificationModel.create({
            userId,
            type: "BOOKING_CONFIRMED",
            title: `Booking Confirmed at ${libName}`,
            message: `Your booking at ${libName} is active! Plan: ${b.plan}. Your Digital ID pass is ready.`,
            link: "/student/bookings",
            isRead: false,
            createdAt: b.createdAt || new Date(),
          });
        }
      }
    } else if (role === "OWNER") {
      const library = await LibraryModel.findOne({ ownerId: userId }).select("_id name").lean();
      if (library) {
        const bookings = await BookingModel.find({
          libraryId: library._id,
          paymentStatus: "SUCCESS",
        })
          .populate("studentId", "name")
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        for (const b of bookings) {
          const exists = await NotificationModel.exists({
            userId,
            type: "NEW_BOOKING",
            link: "/owner/bookings",
          });

          if (!exists) {
            const studentName = (b.studentId as { name?: string } | null)?.name || "A student";
            await NotificationModel.create({
              userId,
              type: "NEW_BOOKING",
              title: "New Student Booking Confirmed!",
              message: `${studentName} has booked a seat at ${library.name} under the ${b.plan} plan.`,
              link: "/owner/bookings",
              isRead: false,
              createdAt: b.createdAt || new Date(),
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("[notifications syncBookingNotifications]", err);
  }
}

// ── GET /api/notifications ────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const userOid = new mongoose.Types.ObjectId(user.id);
    await syncBookingNotifications(userOid, user.role);

    const limit = Number(req.query.limit ?? 20);
    const notifications = await NotificationModel.find({
      userId: userOid,
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
    const userOid = new mongoose.Types.ObjectId(user.id);
    await syncBookingNotifications(userOid, user.role);

    const unreadCount = await NotificationModel.countDocuments({
      userId: userOid,
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

// ── PATCH /api/notifications/:id and /:id/read ─────────────────────────────
const markReadHandler = async (req: Request, res: Response): Promise<void> => {
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

    await emitNotificationCount(user.id);
    res.json({ notification: updated });
  } catch (err) {
    console.error("[notifications/:id/read]", err);
    res.status(500).json({ error: "Failed to update notification." });
  }
};

router.patch("/:id/read", markReadHandler);
router.patch("/:id", markReadHandler);

export default router;
