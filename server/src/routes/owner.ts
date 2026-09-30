import { Router, Request, Response } from "express";
import mongoose from "mongoose";

import connectDB from "../lib/mongodb";
import { isCloudinaryConfigured, isCloudinaryUrl, signUpload } from "../lib/cloudinary";
import { notifyWaitlist } from "../lib/waitlist";
import LibraryModel from "../models/Library";
import BookingModel from "../models/Booking";
import ReviewModel from "../models/Review";
import SlotModel from "../models/Slot";
import PayoutLedgerModel from "../models/PayoutLedger";
import UserModel from "../models/User";
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
  "monthlyFee",
  "quarterlyFee",
  "annualFee",
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

    const fields = pickSlotFields(req.body);
    const totalSeats = Number(fields.totalSeats ?? 0);
    const availableSeats = Number(
      fields.availableSeats !== undefined ? fields.availableSeats : totalSeats
    );
    if (availableSeats > totalSeats) {
      res
        .status(400)
        .json({ error: `availableSeats (${availableSeats}) cannot exceed totalSeats (${totalSeats}).` });
      return;
    }

    const slot = await SlotModel.create({
      libraryId: library._id,
      ...fields,
      availableSeats,
      totalSeats,
    });
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

    const fields = pickSlotFields(req.body);
    const merged = {
      ...prevSlot.toObject(),
      ...fields,
    } as Record<string, unknown>;
    const totalSeats = Number(merged.totalSeats);
    const availableSeats = Number(merged.availableSeats);
    if (
      Number.isFinite(totalSeats) &&
      Number.isFinite(availableSeats) &&
      availableSeats > totalSeats
    ) {
      res
        .status(400)
        .json({ error: `availableSeats (${availableSeats}) cannot exceed totalSeats (${totalSeats}).` });
      return;
    }

    // Whitelisted so libraryId cannot be reassigned — the ownership check above
    // proves the slot is theirs today, not that they may move it elsewhere.
    // availableSeats stays editable: raising it is what triggers the waitlist.
    const updatedSlot = await SlotModel.findByIdAndUpdate(
      req.params.id,
      { $set: fields },
      { new: true, runValidators: true }
    );

    // Raising the seat count is what frees a seat by hand; the nightly expiry
    // job frees them on its own. Both go through the same notifier.
    const freed = (updatedSlot?.availableSeats ?? 0) - prevSlot.availableSeats;
    if (freed > 0) {
      await notifyWaitlist({
        libraryId: library._id as mongoose.Types.ObjectId,
        libraryName: library.name,
        slotId: req.params.id,
        seats: freed,
      });
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

// ─── BLOCKED DATES ────────────────────────────────────────────────────────

router.post("/library/blocked-dates", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    const { start, end, type, note } = req.body as {
      start?: string; end?: string; type?: "HOLIDAY" | "MAINTENANCE"; note?: string;
    };
    if (!start || !end || !type || !["HOLIDAY", "MAINTENANCE"].includes(type)) {
      res.status(400).json({ error: "start, end, and type (HOLIDAY|MAINTENANCE) are required." });
      return;
    }
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id });
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }
    const entry = { _id: new mongoose.Types.ObjectId(), start: new Date(start), end: new Date(end), type, note };
    library.blockedDates.push(entry as unknown as typeof library.blockedDates[number]);
    await library.save();
    res.status(201).json({ entry });
  } catch (err) {
    console.error("[owner/blocked-dates POST]", err);
    res.status(500).json({ error: "Failed to add blocked date." });
  }
});

router.patch("/library/blocked-dates/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    const { start, end, type, note } = req.body as {
      start?: string; end?: string; type?: "HOLIDAY" | "MAINTENANCE"; note?: string;
    };
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id });
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }
    const entry = library.blockedDates.id(req.params.id);
    if (!entry) { res.status(404).json({ error: "Blocked date not found." }); return; }
    if (start) entry.start = new Date(start);
    if (end) entry.end = new Date(end);
    if (type && ["HOLIDAY", "MAINTENANCE"].includes(type)) entry.type = type;
    if (note !== undefined) entry.note = note;
    await library.save();
    res.json({ entry });
  } catch (err) {
    console.error("[owner/blocked-dates PATCH]", err);
    res.status(500).json({ error: "Failed to update blocked date." });
  }
});

router.delete("/library/blocked-dates/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id });
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }
    const sub = library.blockedDates.id(req.params.id);
    if (!sub) { res.status(404).json({ error: "Blocked date not found." }); return; }
    sub.deleteOne();
    await library.save();
    res.json({ success: true });
  } catch (err) {
    console.error("[owner/blocked-dates DELETE]", err);
    res.status(500).json({ error: "Failed to remove blocked date." });
  }
});

// ─── ANALYTICS ─────────────────────────────────────────────────────────────

router.get("/analytics/occupancy", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id }).lean();
    if (!library) {
      res.json({ occupancy: [] });
      return;
    }
    const libId = new mongoose.Types.ObjectId(String(library._id));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDay = new Date(today);
    startDay.setDate(startDay.getDate() - 29);

    const slots = await SlotModel.find({ libraryId: libId }, "totalSeats").lean();
    const totalCapacity = slots.reduce((s, x) => s + Number(x.totalSeats || 0), 0) + 0;
    const cap = totalCapacity > 0 ? totalCapacity : Number(library.totalSeats || 0);

    const activeBookings = await BookingModel.find(
      { libraryId: libId, status: "ACTIVE" },
      "startDate endDate"
    ).lean();

    const occupancy: { date: string; occupancyPct: number }[] = [];
    for (let d = new Date(startDay); d <= today; d.setDate(d.getDate() + 1)) {
      const day = new Date(d);
      const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
      const dayStartTs = day.getTime();
      const dayEndTs = day.getTime() + 86_400_000;
      let occupied = 0;
      for (const b of activeBookings) {
        const bs = new Date(b.startDate).getTime();
        const be = new Date(b.endDate).getTime();
        if (bs < dayEndTs && be > dayStartTs) occupied += 1;
      }
      const pct = cap > 0 ? Math.min(100, Math.round((occupied / cap) * 100)) : 0;
      occupancy.push({ date: dayKey, occupancyPct: pct });
    }
    res.json({ occupancy });
  } catch (err) {
    console.error("[owner/analytics/occupancy]", err);
    res.status(500).json({ error: "Failed to compute occupancy." });
  }
});

router.get("/analytics/retention", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id }).lean();
    if (!library) {
      res.json({ ratePct: 0, history: [] });
      return;
    }
    const libId = new mongoose.Types.ObjectId(String(library._id));
    const history: { month: string; ratePct: number }[] = [];
    const now = new Date();
    for (let offset = 5; offset >= 0; offset -= 1) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0);
      const yyyy = monthStart.getFullYear();
      const mm = String(monthStart.getMonth() + 1).padStart(2, "0");
      const monthLabel = `${yyyy}-${mm}`;

      const cohort = await BookingModel.aggregate([
        { $match: { libraryId: libId, status: { $in: ["ACTIVE", "COMPLETED"] }, startDate: { $lte: monthStart }, endDate: { $gte: monthStart } } },
        { $group: { _id: "$studentId" } },
      ]);
      const retained = await BookingModel.aggregate([
        { $match: { libraryId: libId, status: { $in: ["ACTIVE", "COMPLETED"] }, startDate: { $lte: monthEnd }, endDate: { $gte: monthEnd }, studentId: { $in: cohort.map((c) => c._id) } } },
        { $group: { _id: "$studentId" } },
      ]);
      const rate = cohort.length > 0 ? Math.round((retained.length / cohort.length) * 100) : 0;
      history.push({ month: monthLabel, ratePct: rate });
    }
    res.json({ ratePct: history[history.length - 1]?.ratePct ?? 0, history });
  } catch (err) {
    console.error("[owner/analytics/retention]", err);
    res.status(500).json({ error: "Failed to compute retention." });
  }
});

// ─── REVENUE CSV EXPORT ────────────────────────────────────────────────────

router.get("/revenue/export.csv", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id }).lean();
    if (!library) {
      res.setHeader("Content-Type", "text/csv");
      res.status(200).end();
      return;
    }
    const libId = new mongoose.Types.ObjectId(String(library._id));

    const ledger = await PayoutLedgerModel.find({ libraryId: libId })
      .populate("bookingId", "studentId plan amountPaid createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const studentIds = ledger
      .map((row) => (row.bookingId as { studentId?: unknown } | null)?.studentId)
      .filter(Boolean) as mongoose.Types.ObjectId[];
    const students = await UserModel.find({ _id: { $in: studentIds } }, "name email").lean();
    const stuMap = new Map(students.map((s) => [String(s._id), s]));

    const header = ["Date", "Student", "Plan", "Total (₹)", "Platform (₹)", "Owner Share (₹)", "Payout Status"];
    const esc = (v: unknown): string => {
      const s = v == null ? "" : String(v);
      if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
        return `"${s.replace(/"/g, "\"\"")}"`;
      }
      return s;
    };
    const lines = [header.map(esc).join(",")];
    for (const row of ledger) {
      const b = row.bookingId as { studentId?: unknown; plan?: string; amountPaid?: number; createdAt?: Date } | null;
      const stu = b?.studentId ? stuMap.get(String(b.studentId)) : undefined;
      const date = b?.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN") : "";
      const student = stu ? `${stu.name} <${stu.email}>` : b?.studentId ? String(b.studentId) : "";
      lines.push([
        esc(date),
        esc(student),
        esc((b?.plan ?? "").toLowerCase()),
        esc(row.totalAmount?.toLocaleString("en-IN")),
        esc(row.platformShare?.toLocaleString("en-IN")),
        esc(row.ownerShare?.toLocaleString("en-IN")),
        esc(row.payoutStatus ?? ""),
      ].join(","));
    }

    const csv = lines.join("\r\n");
    const today = new Date();
    const fname = `revenue-report-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);
    res.write(Buffer.from([0xEF, 0xBB, 0xBF])); // UTF-8 BOM
    res.write(csv);
    res.end();
  } catch (err) {
    console.error("[owner/revenue/export.csv]", err);
    res.status(500).json({ error: "Failed to export CSV." });
  }
});

// ─── ATTENDANCE ────────────────────────────────────────────────────────────

router.get("/attendance", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id }).lean();
    if (!library) { res.json({ attendance: [] }); return; }
    const dateRaw = (req.query.date as string | undefined);
    const date = dateRaw ? new Date(dateRaw) : new Date();
    date.setHours(0, 0, 0, 0);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);

    const AttendanceModel = (await import("../models/Attendance")).default;
    const libId = library._id as mongoose.Types.ObjectId;
    const attendance = await AttendanceModel.find({
      libraryId: libId,
      date: { $gte: date, $lt: next },
    }).lean();
    res.json({ attendance });
  } catch (err) {
    console.error("[owner/attendance GET]", err);
    res.status(500).json({ error: "Failed to fetch attendance." });
  }
});

router.post("/attendance", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id });
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }

    const body = req.body as Array<{
      studentId: string; bookingId: string; date: string;
      status: "PRESENT" | "ABSENT"; note?: string;
    }> | {
      studentId: string; bookingId: string; date: string;
      status: "PRESENT" | "ABSENT"; note?: string;
    };
    const items = Array.isArray(body) ? body : [body];

    const AttendanceModel = (await import("../models/Attendance")).default;
    const libId = library._id as mongoose.Types.ObjectId;
    const results: unknown[] = [];
    for (const item of items) {
      if (!item.studentId || !item.bookingId || !item.date || !item.status) continue;
      if (!["PRESENT", "ABSENT"].includes(item.status)) continue;
      const day = new Date(item.date);
      day.setHours(0, 0, 0, 0);
      const owns = await BookingModel.countDocuments({
        _id: item.bookingId,
        libraryId: libId,
        studentId: item.studentId,
        status: "ACTIVE",
      });
      if (owns === 0) continue;
      const updated = await AttendanceModel.findOneAndUpdate(
        { libraryId: libId, studentId: item.studentId, bookingId: item.bookingId, date: day },
        { $set: { status: item.status, markedBy: user.id, markedAt: new Date(), note: item.note } },
        { upsert: true, new: true, runValidators: true }
      ).lean();
      results.push(updated);
    }
    res.json({ count: results.length, saved: results });
  } catch (err) {
    console.error("[owner/attendance POST]", err);
    res.status(500).json({ error: "Failed to save attendance." });
  }
});

// ─── STUDENTS: MESSAGE + BULK NOTIFY ──────────────────────────────────────

router.post("/students/:bookingId/message", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    const { content } = req.body as { content?: string };
    if (!content || !content.trim()) {
      res.status(400).json({ error: "content is required." });
      return;
    }
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id }).lean();
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }
    const libId = library._id as mongoose.Types.ObjectId;
    const booking = await BookingModel.findOne({
      _id: req.params.bookingId,
      libraryId: libId,
      status: "ACTIVE",
    }).lean();
    if (!booking) { res.status(404).json({ error: "Active booking not found." }); return; }

    const MessageModel = (await import("../models/Message")).default;
    const message = await MessageModel.create({
      senderId: user.id,
      receiverId: booking.studentId,
      libraryId: libId,
      content: content.trim(),
    });
    const io = await import("../lib/socket").then((m) => m.getSocketIO?.()).catch(() => null);
    if (io) {
      io.to(`user:${String(booking.studentId)}`).emit("new_message", message.toObject());
      io.to(`user:${user.id}`).emit("new_message", message.toObject());
    }
    res.status(201).json({ message });
  } catch (err) {
    console.error("[owner/students/:bookingId/message]", err);
    res.status(500).json({ error: "Failed to send message." });
  }
});

const BULK_NOTIFY_RATE_LIMIT_MS = 10 * 60 * 1000;
const bulkNotifyLastSent = new Map<string, number>();

router.post("/students/notify-bulk", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    const { title, message } = req.body as { title?: string; message?: string };
    if (!title || !message) {
      res.status(400).json({ error: "title and message are required." });
      return;
    }
    await connectDB();
    const library = await LibraryModel.findOne({ ownerId: user.id }).lean();
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }
    const libId = library._id as mongoose.Types.ObjectId;

    const now = Date.now();
    const lastSent = bulkNotifyLastSent.get(String(user.id)) ?? 0;
    const remaining = lastSent + BULK_NOTIFY_RATE_LIMIT_MS - now;
    if (remaining > 0) {
      const retryAfterSeconds = Math.ceil(remaining / 1000);
      res.status(429).json({
        error: `Too many bulk notifications. Please wait ${retryAfterSeconds} seconds.`,
        retryAfterSeconds,
      });
      return;
    }

    const activeBookings = await BookingModel.find(
      { libraryId: libId, status: "ACTIVE" },
      "studentId"
    ).lean();
    const studentIds = [...new Set(activeBookings.map((b) => String(b.studentId)))];

    const NotificationModel = (await import("../models/Notification")).default;
    const docs = studentIds.map((sid) => ({
      userId: new mongoose.Types.ObjectId(sid),
      type: "LIBRARY",
      title: title.trim(),
      message: message.trim(),
      link: "/student/notifications",
      isRead: false,
    }));
    if (docs.length > 0) {
      await NotificationModel.insertMany(docs, { ordered: false });
    }
    const io = await import("../lib/socket").then((m) => m.getSocketIO?.()).catch(() => null);
    if (io) {
      for (const sid of studentIds) {
        io.to(`user:${sid}`).emit("new_notification", {
          title: title.trim(),
          message: message.trim(),
          type: "LIBRARY",
        });
      }
    }
    bulkNotifyLastSent.set(String(user.id), now);
    setTimeout(() => bulkNotifyLastSent.delete(String(user.id)), BULK_NOTIFY_RATE_LIMIT_MS + 1000);
    res.json({ success: true, notifiedCount: studentIds.length });
  } catch (err) {
    console.error("[owner/students/notify-bulk]", err);
    res.status(500).json({ error: "Failed to send bulk notification." });
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
