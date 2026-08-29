import { Router, Request, Response } from "express";
import mongoose from "mongoose";

import connectDB from "../lib/mongodb";
import { isCloudinaryConfigured, isCloudinaryUrl, signUpload } from "../lib/cloudinary";
import LibraryModel from "../models/Library";
import BookingModel from "../models/Booking";
import ReviewModel from "../models/Review";
import SlotModel from "../models/Slot";
import WaitlistModel from "../models/Waitlist";
import NotificationModel from "../models/Notification";
import PayoutLedgerModel from "../models/PayoutLedger";
import { sendSeatAlertEmail } from "../lib/email";
import { emitNotificationCount } from "../lib/notifications";
import { requireAuth, requireOwner } from "../middleware/auth";

const router = Router();
router.use(requireAuth);
router.use(requireOwner);

/**
 * Fields an owner is allowed to change on their own library.
 *
 * Deliberately excludes isVerified, isActive, ratingAvg, reviewCount,
 * availableSeats and ownerId: those are set by admin review, by the rating
 * aggregate, or by the booking flow. Spreading req.body would let an owner
 * self-verify and bypass admin approval entirely.
 */
const EDITABLE_LIBRARY_FIELDS = [
  "name",
  "description",
  "address",
  "city",
  "state",
  "district",
  "pincode",
  "contactPhone",
  "contactEmail",
  "whatsapp",
  "monthlyFee",
  "quarterlyFee",
  "annualFee",
  "facilities",
  "studentTypes",
  "totalSeats",
  "openTime",
  "closeTime",
  "lat",
  "lng",
] as const;

/** Slot fields an owner may change. libraryId is deliberately absent. */
const EDITABLE_SLOT_FIELDS = [
  "name",
  "startTime",
  "endTime",
  "totalSeats",
  "availableSeats",
] as const;

function pick(
  body: Record<string, unknown>,
  allowed: readonly string[]
): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) picked[key] = body[key];
  }
  return picked;
}

function pickEditable(body: Record<string, unknown>): Record<string, unknown> {
  return pick(body, EDITABLE_LIBRARY_FIELDS);
}

function pickSlotFields(body: Record<string, unknown>): Record<string, unknown> {
  return pick(body, EDITABLE_SLOT_FIELDS);
}

function withLocation(body: Record<string, unknown>): Record<string, unknown> {
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { ...body, location: { type: "Point", coordinates: [lng, lat] } };
  }
  return body;
}

// ─── STATS ────────────────────────────────────────────────────────────────
router.get("/stats", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id }).lean();
    if (!library) {
      res.json({ library: null, totalStudents: 0, monthlyRevenue: 0, pendingReviews: 0, monthlyChart: [], recentBookings: [] });
      return;
    }
    const libId = new mongoose.Types.ObjectId(String(library._id));
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [totalStudents, monthlyAgg, pendingReviews, monthlyChart, recentBookings] = await Promise.all([
      BookingModel.countDocuments({ libraryId: libId, status: "ACTIVE" }),
      BookingModel.aggregate([{ $match: { libraryId: libId, paymentStatus: "SUCCESS", createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: "$amountPaid" } } }]),
      ReviewModel.countDocuments({ libraryId: libId, ownerReply: { $exists: false } }),
      BookingModel.aggregate([
        { $match: { libraryId: libId, paymentStatus: "SUCCESS", createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) } } },
        { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, revenue: { $sum: "$amountPaid" }, count: { $sum: 1 } } },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      BookingModel.find({ libraryId: libId }).populate("studentId", "name email").sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    res.json({ library, totalStudents, monthlyRevenue: monthlyAgg[0]?.total ?? 0, pendingReviews, monthlyChart, recentBookings });
  } catch (err) {
    console.error("[owner/stats]", err);
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// ─── LIBRARY ──────────────────────────────────────────────────────────────
router.get("/library", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id }).lean();
    res.json({ library: library ?? null });
  } catch (err) {
    console.error("[owner/library GET]", err);
    res.status(500).json({ error: "Failed to fetch library." });
  }
});

router.patch("/library", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const library = await LibraryModel.findOneAndUpdate({ ownerId: user.id }, { $set: withLocation(pickEditable(req.body)) }, { new: true, runValidators: true });
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }
    res.json({ library });
  } catch (err) {
    console.error("[owner/library PATCH]", err);
    res.status(500).json({ error: "Failed to update library." });
  }
});

router.post("/library", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const existing = await LibraryModel.findOne({ ownerId: user.id });
    if (existing) { res.status(409).json({ error: "You already have a library. Edit it instead." }); return; }
    const library = await LibraryModel.create({ ...withLocation(pickEditable(req.body)), ownerId: user.id });
    res.status(201).json({ library });
  } catch (err) {
    console.error("[owner/library POST]", err);
    res.status(500).json({ error: "Failed to create library." });
  }
});

// ─── LIBRARY PHOTOS ───────────────────────────────────────────────────────

/**
 * A short-lived upload signature scoped to this owner's own library folder.
 * The browser uploads straight to Cloudinary with it, then posts the returned
 * secure_url back to POST /library/photos.
 */
router.get("/library/photos/signature", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    if (!isCloudinaryConfigured) {
      res.status(503).json({ error: "Photo uploads are not configured on this server." });
      return;
    }
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id }).lean();
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }

    res.json(signUpload(`scholarshub/libraries/${String(library._id)}`));
  } catch (err) {
    console.error("[owner/photos signature]", err);
    res.status(500).json({ error: "Failed to prepare the upload." });
  }
});

router.post("/library/photos", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    const { url, isCover = false } = req.body as { url?: string; isCover?: boolean };
    if (!url) { res.status(400).json({ error: "url is required" }); return; }
    // The client used to be able to name any URL on any host, and next.config
    // rendered it. Only what our own Cloudinary account handed back is stored.
    if (!isCloudinaryUrl(url)) {
      res.status(400).json({
        error: "Photos must be uploaded through the dashboard. Only images hosted on this platform's Cloudinary account are accepted.",
      });
      return;
    }
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id });
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }
    await LibraryModel.findByIdAndUpdate(library._id, { $push: { photos: { url, isCover, order: library.photos.length } } });
    res.json({ success: true });
  } catch (err) {
    console.error("[owner/photos POST]", err);
    res.status(500).json({ error: "Failed to add photo." });
  }
});

router.delete("/library/photos", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const { url } = req.body as { url?: string };
    if (!url) { res.status(400).json({ error: "url is required" }); return; }
    const library = await LibraryModel.findOneAndUpdate({ ownerId: user.id }, { $pull: { photos: { url } } }, { new: true });
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }
    res.json({ success: true });
  } catch (err) {
    console.error("[owner/photos DELETE]", err);
    res.status(500).json({ error: "Failed to delete photo." });
  }
});

router.patch("/library/photos", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const { coverUrl } = req.body as { coverUrl?: string };
    const library = await LibraryModel.findOne({ ownerId: user.id });
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }
    library.photos = library.photos.map((p: { url: string; isCover: boolean; order: number }) => ({ ...p, isCover: p.url === coverUrl }));
    await library.save();
    res.json({ success: true });
  } catch (err) {
    console.error("[owner/photos PATCH]", err);
    res.status(500).json({ error: "Failed to update cover." });
  }
});

// ─── BOOKINGS ─────────────────────────────────────────────────────────────
router.get("/bookings", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id }).lean();
    if (!library) { res.json({ bookings: [] }); return; }
    const bookings = await BookingModel.find({ libraryId: library._id })
      .populate("studentId", "name email phone avatarUrl")
      .populate("slotId", "name startTime endTime")
      .sort({ createdAt: -1 }).lean();
    res.json({ bookings });
  } catch (err) {
    console.error("[owner/bookings]", err);
    res.status(500).json({ error: "Failed to fetch bookings." });
  }
});

// ─── REVENUE ──────────────────────────────────────────────────────────────
router.get("/revenue", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id }).lean();
    if (!library) {
      res.json({ planBreakdown: [], monthlyChart: [], ledger: [], allTime: 0, thisMonth: 0, lastMonth: 0 });
      return;
    }
    const libId = new mongoose.Types.ObjectId(String(library._id));
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [planBreakdown, monthlyChart, ledger, allTimeAgg, thisMonthAgg, lastMonthAgg] = await Promise.all([
      BookingModel.aggregate([{ $match: { libraryId: libId, paymentStatus: "SUCCESS" } }, { $group: { _id: "$plan", revenue: { $sum: "$amountPaid" }, count: { $sum: 1 } } }]),
      BookingModel.aggregate([{ $match: { libraryId: libId, paymentStatus: "SUCCESS", createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } }, { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, revenue: { $sum: "$amountPaid" } } }, { $sort: { "_id.year": 1, "_id.month": 1 } }]),
      PayoutLedgerModel.find({ libraryId: libId }).populate("bookingId", "studentId plan amountPaid createdAt").sort({ createdAt: -1 }).limit(50).lean(),
      BookingModel.aggregate([{ $match: { libraryId: libId, paymentStatus: "SUCCESS" } }, { $group: { _id: null, total: { $sum: "$amountPaid" } } }]),
      BookingModel.aggregate([{ $match: { libraryId: libId, paymentStatus: "SUCCESS", createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: "$amountPaid" } } }]),
      BookingModel.aggregate([{ $match: { libraryId: libId, paymentStatus: "SUCCESS", createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } }, { $group: { _id: null, total: { $sum: "$amountPaid" } } }]),
    ]);

    res.json({ planBreakdown, monthlyChart, ledger, allTime: allTimeAgg[0]?.total ?? 0, thisMonth: thisMonthAgg[0]?.total ?? 0, lastMonth: lastMonthAgg[0]?.total ?? 0 });
  } catch (err) {
    console.error("[owner/revenue]", err);
    res.status(500).json({ error: "Failed to fetch revenue." });
  }
});

// ─── REVIEWS ──────────────────────────────────────────────────────────────
router.get("/reviews", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id }).lean();
    if (!library) { res.json({ reviews: [] }); return; }
    const reviews = await ReviewModel.find({ libraryId: library._id }).populate("studentId", "name avatarUrl").sort({ createdAt: -1 }).lean();
    res.json({ reviews });
  } catch (err) {
    console.error("[owner/reviews GET]", err);
    res.status(500).json({ error: "Failed to fetch reviews." });
  }
});

router.patch("/reviews", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const { reviewId, ownerReply } = req.body as { reviewId?: string; ownerReply?: string };
    const library = await LibraryModel.findOne({ ownerId: user.id });
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }
    const review = await ReviewModel.findOneAndUpdate({ _id: reviewId, libraryId: library._id }, { ownerReply, ownerRepliedAt: new Date() }, { new: true });
    if (!review) { res.status(404).json({ error: "Review not found." }); return; }
    res.json({ review });
  } catch (err) {
    console.error("[owner/reviews PATCH]", err);
    res.status(500).json({ error: "Failed to update review." });
  }
});

// ─── SLOTS ────────────────────────────────────────────────────────────────
router.get("/slots", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id }).lean();
    if (!library) { res.json({ slots: [] }); return; }
    const slots = await SlotModel.find({ libraryId: library._id }).lean();
    res.json({ slots });
  } catch (err) {
    console.error("[owner/slots GET]", err);
    res.status(500).json({ error: "Failed to fetch slots." });
  }
});

router.post("/slots", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id });
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }
    const { name, startTime, endTime, totalSeats } = req.body as { name: string; startTime: string; endTime: string; totalSeats: number };
    const slot = await SlotModel.create({ libraryId: library._id, name, startTime, endTime, totalSeats, availableSeats: totalSeats });
    res.status(201).json({ slot });
  } catch (err) {
    console.error("[owner/slots POST]", err);
    res.status(500).json({ error: "Failed to create slot." });
  }
});

router.patch("/slots/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id });
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }

    const prevSlot = await SlotModel.findOne({ _id: req.params.id, libraryId: library._id });
    if (!prevSlot) { res.status(404).json({ error: "Slot not found." }); return; }

    // Whitelisted so libraryId cannot be reassigned — the ownership check above
    // proves the slot is theirs today, not that they may move it elsewhere.
    // availableSeats stays editable: raising it is what triggers the waitlist.
    const updatedSlot = await SlotModel.findByIdAndUpdate(
      req.params.id,
      { $set: pickSlotFields(req.body) },
      { new: true, runValidators: true }
    );

    const freed = (updatedSlot?.availableSeats ?? 0) - prevSlot.availableSeats;
    if (freed > 0) {
      const waiting = await WaitlistModel.find({ slotId: req.params.id })
        .sort({ position: 1 })
        .limit(freed)
        .populate("studentId", "name email phone fcmToken");

      for (const entry of waiting) {
        const student = entry.studentId as {
          _id: mongoose.Types.ObjectId;
          name?: string;
          email?: string;
        };

        await NotificationModel.create({
          userId: student._id,
          type: "SEAT_ALERT",
          title: "Seat Available!",
          message: `A seat opened at ${library.name}. You have 2 hrs to book.`,
          link: `/library/${entry.libraryId}`,
          isRead: false,
        });

        if (student.email) {
          try {
            await sendSeatAlertEmail(
              student.email,
              student.name ?? "Student",
              library.name,
              `/library/${entry.libraryId}`
            );
          } catch (emailErr) {
            console.error("[owner/slots PATCH] seat alert email failed:", emailErr);
          }
        }

        await WaitlistModel.findByIdAndUpdate(entry._id, {
          notified: true,
          heldUntil: new Date(Date.now() + 2 * 60 * 60 * 1000),
        });

        await emitNotificationCount(String(student._id));
      }
    }

    res.json({ slot: updatedSlot });
  } catch (err) {
    console.error("[owner/slots PATCH]", err);
    res.status(500).json({ error: "Failed to update slot." });
  }
});

router.delete("/slots/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id });
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }
    await SlotModel.findOneAndDelete({ _id: req.params.id, libraryId: library._id });
    res.json({ success: true });
  } catch (err) {
    console.error("[owner/slots DELETE]", err);
    res.status(500).json({ error: "Failed to delete slot." });
  }
});

// ─── STUDENTS ─────────────────────────────────────────────────────────────
router.get("/students", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id }).lean();
    if (!library) { res.json({ students: [] }); return; }

    const bookings = await BookingModel.find({ libraryId: library._id, status: "ACTIVE" })
      .populate("studentId", "name email phone avatarUrl examType city")
      .populate("slotId", "name startTime endTime").lean();

    res.json({ students: bookings });
  } catch (err) {
    console.error("[owner/students]", err);
    res.status(500).json({ error: "Failed to fetch students." });
  }
});

export default router;
