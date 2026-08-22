import { Router, Request, Response } from "express";
import mongoose from "mongoose";

import connectDB from "../lib/mongodb";
import BookingModel from "../models/Booking";
import ReviewModel from "../models/Review";
import StudentCourseModel from "../models/StudentCourse";
import NotificationModel from "../models/Notification";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// ─── STATS ────────────────────────────────────────────────────────────────
router.get("/stats", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const id = new mongoose.Types.ObjectId(user.id);

    const [totalBookings, spentAgg, reviewCount, courseCount, notifications] = await Promise.all([
      BookingModel.countDocuments({ studentId: id, status: "ACTIVE" }),
      BookingModel.aggregate([{ $match: { studentId: id, paymentStatus: "SUCCESS" } }, { $group: { _id: null, total: { $sum: "$amountPaid" } } }]),
      ReviewModel.countDocuments({ studentId: id }),
      StudentCourseModel.countDocuments({ studentId: id }),
      NotificationModel.find({ userId: id }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    res.json({ totalBookings, totalSpent: spentAgg[0]?.total ?? 0, reviewCount, courseCount, notifications });
  } catch (err) {
    console.error("[student/stats]", err);
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────
router.get("/notifications", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const limit = Number(req.query.limit ?? 10);
    const notifications = await NotificationModel.find({ userId: new mongoose.Types.ObjectId(user.id) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ notifications });
  } catch (err) {
    console.error("[student/notifications]", err);
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
});

// ─── BOOKINGS ─────────────────────────────────────────────────────────────
router.get("/bookings/active", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const id = new mongoose.Types.ObjectId(user.id);
    const active = await BookingModel.findOne({ studentId: id, status: "ACTIVE" })
      .populate("libraryId", "name address city photos contactPhone")
      .populate("slotId", "name startTime endTime")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ booking: active ?? null });
  } catch (err) {
    console.error("[student/bookings/active]", err);
    res.status(500).json({ error: "Failed to fetch active booking." });
  }
});

router.get("/bookings", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const id = new mongoose.Types.ObjectId(user.id);

    const [active, past] = await Promise.all([
      BookingModel.find({ studentId: id, status: "ACTIVE" })
        .populate("libraryId", "name address city photos contactPhone")
        .populate("slotId", "name startTime endTime").sort({ createdAt: -1 }).lean(),
      BookingModel.find({ studentId: id, status: { $in: ["EXPIRED", "CANCELLED"] } })
        .populate("libraryId", "name address city").sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    res.json({ active, past });
  } catch (err) {
    console.error("[student/bookings]", err);
    res.status(500).json({ error: "Failed to fetch bookings." });
  }
});

// ─── COURSES ──────────────────────────────────────────────────────────────
router.get("/courses", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const id = new mongoose.Types.ObjectId(user.id);
    const enrolled = await StudentCourseModel.find({ studentId: id }).populate("courseId").sort({ createdAt: -1 }).lean();
    res.json({ enrolled });
  } catch (err) {
    console.error("[student/courses]", err);
    res.status(500).json({ error: "Failed to fetch courses." });
  }
});

// ─── PAYMENTS ─────────────────────────────────────────────────────────────
router.get("/payments", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const id = new mongoose.Types.ObjectId(user.id);
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    const [payments, yearlyAgg] = await Promise.all([
      BookingModel.find({ studentId: id }).populate("libraryId", "name city").sort({ createdAt: -1 }).lean(),
      BookingModel.aggregate([{ $match: { studentId: id, paymentStatus: "SUCCESS", createdAt: { $gte: startOfYear } } }, { $group: { _id: null, total: { $sum: "$amountPaid" } } }]),
    ]);

    res.json({ payments, yearlyTotal: yearlyAgg[0]?.total ?? 0 });
  } catch (err) {
    console.error("[student/payments]", err);
    res.status(500).json({ error: "Failed to fetch payments." });
  }
});

export default router;

// ─── WAITLIST ─────────────────────────────────────────────────────────────
import WaitlistModel from "../models/Waitlist";
import UserModel from "../models/User";

router.get("/waitlist", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const id = new mongoose.Types.ObjectId(user.id);
    const entries = await WaitlistModel.find({ studentId: id })
      .populate("libraryId", "name city")
      .populate("slotId", "name startTime endTime")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ entries });
  } catch (err) {
    console.error("[student/waitlist GET]", err);
    res.status(500).json({ error: "Failed to fetch waitlist." });
  }
});

router.delete("/waitlist/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const entry = await WaitlistModel.findOneAndDelete({
      _id: req.params.id,
      studentId: new mongoose.Types.ObjectId(user.id),
    });
    if (!entry) {
      res.status(404).json({ error: "Waitlist entry not found." });
      return;
    }
    // Compact positions for remaining entries in same library+slot queue
    await WaitlistModel.updateMany(
      {
        libraryId: entry.libraryId,
        slotId:    entry.slotId ?? null,
        position:  { $gt: entry.position },
      },
      { $inc: { position: -1 } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("[student/waitlist DELETE]", err);
    res.status(500).json({ error: "Failed to leave waitlist." });
  }
});

// ─── REVIEWS ──────────────────────────────────────────────────────────────
router.get("/reviews", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const id = new mongoose.Types.ObjectId(user.id);

    // Reviews the student has written
    const reviews = await ReviewModel.find({ studentId: id })
      .populate("libraryId", "name city")
      .populate("bookingId", "plan startDate endDate")
      .sort({ createdAt: -1 })
      .lean();

    // Expired bookings not yet reviewed (eligible to write a review)
    const reviewedBookingIds = reviews.map((r) =>
      (r.bookingId as { _id: mongoose.Types.ObjectId } | null)?._id?.toString()
    ).filter(Boolean);

    const eligibleBookings = await BookingModel.find({
      studentId: id,
      status: { $in: ["EXPIRED", "CANCELLED"] },
      _id: { $nin: reviewedBookingIds.map((bid) => new mongoose.Types.ObjectId(bid!)) },
    })
      .populate("libraryId", "name city")
      .sort({ endDate: -1 })
      .limit(10)
      .lean();

    res.json({ reviews, eligibleBookings });
  } catch (err) {
    console.error("[student/reviews GET]", err);
    res.status(500).json({ error: "Failed to fetch reviews." });
  }
});

router.post("/reviews", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const id = new mongoose.Types.ObjectId(user.id);

    const { bookingId, rating, comment } = req.body as {
      bookingId?: string;
      rating?: number;
      comment?: string;
    };

    if (!bookingId || !rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: "bookingId and rating (1–5) are required." });
      return;
    }

    // Verify the booking belongs to this student and is expired/cancelled
    const booking = await BookingModel.findOne({
      _id: new mongoose.Types.ObjectId(bookingId),
      studentId: id,
      status: { $in: ["EXPIRED", "CANCELLED"] },
    });
    if (!booking) {
      res.status(403).json({ error: "Booking not found or not eligible for review." });
      return;
    }

    // Enforce one review per booking (unique index on bookingId in schema)
    const existing = await ReviewModel.findOne({ bookingId: booking._id });
    if (existing) {
      res.status(409).json({ error: "You have already reviewed this booking." });
      return;
    }

    const review = await ReviewModel.create({
      studentId: id,
      libraryId: booking.libraryId,
      bookingId: booking._id,
      rating,
      comment:    comment?.trim() || undefined,
      isVerified: true,
    });

    // Update library ratingAvg + reviewCount
    const LibraryModel = (await import("../models/Library")).default;
    const [agg] = await ReviewModel.aggregate([
      { $match: { libraryId: booking.libraryId } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    if (agg) {
      await LibraryModel.findByIdAndUpdate(booking.libraryId, {
        ratingAvg:   Math.round(agg.avg * 10) / 10,
        reviewCount: agg.count,
      });
    }

    const populated = await review.populate([
      { path: "libraryId", select: "name city" },
      { path: "bookingId", select: "plan startDate endDate" },
    ]);

    res.status(201).json({ review: populated });
  } catch (err) {
    console.error("[student/reviews POST]", err);
    res.status(500).json({ error: "Failed to submit review." });
  }
});

router.patch("/reviews/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const id = new mongoose.Types.ObjectId(user.id);
    const { rating, comment } = req.body as { rating?: number; comment?: string };

    const review = await ReviewModel.findOne({ _id: req.params.id, studentId: id });
    if (!review) {
      res.status(404).json({ error: "Review not found." });
      return;
    }

    // Allow editing only within 24 hours of creation
    const hoursSinceCreation = (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      res.status(403).json({ error: "Reviews can only be edited within 24 hours of submission." });
      return;
    }

    if (rating && rating >= 1 && rating <= 5) review.rating = rating;
    if (comment !== undefined) review.comment = comment.trim() || undefined;

    await review.save();
    const populated = await review.populate([
      { path: "libraryId", select: "name city" },
      { path: "bookingId", select: "plan startDate endDate" },
    ]);

    res.json({ review: populated });
  } catch (err) {
    console.error("[student/reviews PATCH]", err);
    res.status(500).json({ error: "Failed to update review." });
  }
});

// ─── PROFILE ──────────────────────────────────────────────────────────────
router.get("/profile", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const dbUser = await UserModel.findById(user.id)
      .select("name email phone city state examType targetYear avatarUrl createdAt")
      .lean();
    if (!dbUser) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.json({ profile: dbUser });
  } catch (err) {
    console.error("[student/profile GET]", err);
    res.status(500).json({ error: "Failed to fetch profile." });
  }
});

router.patch("/profile", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();

    const { name, phone, city, state, examType, targetYear } = req.body as {
      name?: string;
      phone?: string;
      city?: string;
      state?: string;
      examType?: string;
      targetYear?: number;
    };

    const allowed: Record<string, unknown> = {};
    if (name?.trim())            allowed.name       = name.trim();
    if (phone?.trim())           allowed.phone      = phone.trim();
    if (city?.trim())            allowed.city       = city.trim();
    if (state?.trim())           allowed.state      = state.trim();
    if (examType?.trim())        allowed.examType   = examType.trim();
    if (typeof targetYear === "number" && targetYear >= new Date().getFullYear()) {
      allowed.targetYear = targetYear;
    }

    const updated = await UserModel.findByIdAndUpdate(
      user.id,
      { $set: allowed },
      { new: true, runValidators: true }
    ).select("name email phone city state examType targetYear avatarUrl");

    if (!updated) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.json({ profile: updated });
  } catch (err) {
    console.error("[student/profile PATCH]", err);
    res.status(500).json({ error: "Failed to update profile." });
  }
});
