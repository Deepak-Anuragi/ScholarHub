import { Router, Request, Response } from "express";
import mongoose from "mongoose";

import connectDB from "../lib/mongodb";
import LibraryModel from "../models/Library";
import BookingModel from "../models/Booking";
import ReviewModel from "../models/Review";
import SlotModel from "../models/Slot";
import WaitlistModel from "../models/Waitlist";
import NotificationModel from "../models/Notification";
import PayoutLedgerModel from "../models/PayoutLedger";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

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
    const library = await LibraryModel.findOneAndUpdate({ ownerId: user.id }, { $set: req.body }, { new: true, runValidators: true });
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
    const library = await LibraryModel.create({ ...req.body, ownerId: user.id });
    res.status(201).json({ library });
  } catch (err) {
    console.error("[owner/library POST]", err);
    res.status(500).json({ error: "Failed to create library." });
  }
});

// ─── LIBRARY PHOTOS ───────────────────────────────────────────────────────
router.post("/library/photos", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const { url, isCover = false } = req.body as { url?: string; isCover?: boolean };
    if (!url) { res.status(400).json({ error: "url is required" }); return; }
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

    const updatedSlot = await SlotModel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });

    const freed = (updatedSlot?.availableSeats ?? 0) - prevSlot.availableSeats;
    if (freed > 0) {
      const waitlisted = await WaitlistModel.find({ slotId: req.params.id }).sort({ position: 1 }).limit(freed).lean();
      for (const entry of waitlisted) {
        await NotificationModel.create({
          userId: entry.studentId, type: "WAITLIST_AVAILABLE", title: "Seat Available!",
          message: `A seat opened up at ${library.name}. Book now before it fills up.`,
          link: `/library/${library._id}`, isRead: false,
        });
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
