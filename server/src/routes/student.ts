import { Router, Request, Response } from "express";
import mongoose from "mongoose";

import connectDB from "../lib/mongodb";
import { computeRefund } from "../lib/refund";
import BookingModel from "../models/Booking";
import LibraryModel from "../models/Library";
import ReviewModel from "../models/Review";
import SlotModel from "../models/Slot";
import StudentCourseModel from "../models/StudentCourse";
import NotificationModel from "../models/Notification";
import WaitlistModel from "../models/Waitlist";
import UserModel from "../models/User";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// ─── STATS ────────────────────────────────────────────────────────────────
router.get("/stats", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const id = new mongoose.Types.ObjectId(user.id);

    const [activeBookings, spentAgg, reviewCount, courseCount, notifications] = await Promise.all([
      // Bookings still running. Named for what it counts: the dashboard card
      // labelled "Active Bookings" reads it, and the old name said otherwise.
      BookingModel.countDocuments({ studentId: id, status: "ACTIVE" }),
      BookingModel.aggregate([{ $match: { studentId: id, paymentStatus: "SUCCESS" } }, { $group: { _id: null, total: { $sum: "$amountPaid" } } }]),
      ReviewModel.countDocuments({ studentId: id }),
      StudentCourseModel.countDocuments({ studentId: id }),
      NotificationModel.find({ userId: id }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    res.json({ activeBookings, totalSpent: spentAgg[0]?.total ?? 0, reviewCount, courseCount, notifications });
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

// Task 6.1 — GET /api/student/bookings (Req 3.1)
// Returns active and past bookings with all fee fields and library address.
router.get("/bookings", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const id = new mongoose.Types.ObjectId(user.id);

    const [active, past] = await Promise.all([
      BookingModel.find({ studentId: id, status: "ACTIVE" })
        .populate("libraryId", "name address city photos contactPhone")
        .populate("slotId", "name startTime endTime")
        .select("libraryId slotId plan startDate endDate libraryFee platformFee amountPaid paymentId razorpayOrderId status createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      BookingModel.find({ studentId: id, status: { $in: ["EXPIRED", "CANCELLED"] } })
        .populate("libraryId", "name address city")
        .populate("slotId", "name startTime endTime")
        .select("libraryId slotId plan startDate endDate libraryFee platformFee amountPaid paymentId razorpayOrderId status createdAt")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    res.json({ active, past });
  } catch (err) {
    console.error("[student/bookings]", err);
    res.status(500).json({ error: "Failed to fetch bookings." });
  }
});

// Task 5.1 — GET /api/student/bookings/:id/cancellation-preview (Req 2.6, 2.8)
// Read-only — computes the refund preview without modifying any data.
router.get("/bookings/:id/cancellation-preview", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();

    const booking = await BookingModel.findById(req.params.id).lean();
    if (!booking) {
      res.status(404).json({ error: "Booking not found." });
      return;
    }
    if (booking.studentId.toString() !== user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { refundAmount, refundTier, refundPolicy } = computeRefund(
      booking.amountPaid,
      booking.startDate
    );

    res.json({ refundAmount, refundTier, refundPolicy });
  } catch (err) {
    console.error("[student/bookings/cancellation-preview]", err);
    res.status(500).json({ error: "Failed to compute cancellation preview." });
  }
});

// Task 5.2 — DELETE /api/student/bookings/:id (Req 2.3, 2.4, 2.5, 2.7, 2.8)
// Cancels an ACTIVE booking, computes refund, restores seats, and notifies waitlist.
router.delete("/bookings/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ error: "Booking not found." });
      return;
    }
    if (booking.studentId.toString() !== user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    if (booking.status !== "ACTIVE") {
      res.status(409).json({ error: "Only active bookings can be cancelled." });
      return;
    }

    const { refundAmount, refundTier, refundPolicy } = computeRefund(
      booking.amountPaid,
      booking.startDate
    );

    booking.status = "CANCELLED";
    booking.paymentStatus = refundAmount > 0 ? "REFUNDED" : booking.paymentStatus;
    await booking.save();

    if (booking.slotId) {
      await SlotModel.findOneAndUpdate(
        { _id: booking.slotId },
        { $inc: { availableSeats: 1 } }
      );
    }
    await LibraryModel.findOneAndUpdate(
      { _id: booking.libraryId },
      { $inc: { availableSeats: 1 } }
    );

    if (booking.slotId) {
      const WaitlistModelDyn = (await import("../models/Waitlist")).default;
      const nextEntry = await WaitlistModelDyn.findOne({
        libraryId: booking.libraryId,
        slotId: booking.slotId,
      })
        .sort({ position: 1 })
        .populate("studentId", "email name")
        .lean();

      if (nextEntry && nextEntry.studentId) {
        const NotifModelDyn = (await import("../models/Notification")).default;
        const student = nextEntry.studentId as { _id: mongoose.Types.ObjectId; email: string; name: string };
        await NotifModelDyn.create({
          userId: student._id,
          title: "Seat Available!",
          message: `A seat has opened up for your waitlisted slot. Book now before it's taken!`,
          type: "WAITLIST",
          read: false,
        });
      }
    }

    res.json({
      success: true,
      refundAmount,
      refundTier,
      refundPolicy,
    });
  } catch (err) {
    console.error("[student/bookings DELETE]", err);
    res.status(500).json({ error: "Failed to cancel booking." });
  }
});

// Task 6.2 — GET /api/student/bookings/:id/receipt (Req 3.2, 3.5)
router.get("/bookings/:id/receipt", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();

    const rawBooking = await BookingModel.findById(req.params.id)
      .populate("libraryId", "name address city")
      .populate("studentId", "name email")
      .lean() as unknown as (Record<string, unknown> & {
        studentId: { _id: mongoose.Types.ObjectId; name: string; email: string };
        libraryId: { name: string; address?: string; city: string };
        plan: string; startDate: Date; endDate: Date;
        libraryFee?: number; platformFee?: number; amountPaid: number; paymentId?: string;
      }) | null;

    const booking = rawBooking;

    if (!booking) {
      res.status(404).json({ error: "Booking not found." });
      return;
    }

    const populatedStudent = booking.studentId;
    if (populatedStudent._id.toString() !== user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const lib = booking.libraryId;
    const addressParts = [lib.address, lib.city].filter(Boolean);
    const receiptNumber = "SH-" + req.params.id.toString().slice(-8).toUpperCase();

    res.json({
      receiptNumber,
      studentName:    populatedStudent.name,
      studentEmail:   populatedStudent.email,
      libraryName:    lib.name,
      libraryAddress: addressParts.join(", "),
      plan:           booking.plan,
      startDate:      booking.startDate,
      endDate:        booking.endDate,
      libraryFee:     booking.libraryFee ?? 0,
      platformFee:    booking.platformFee ?? 0,
      amountPaid:     booking.amountPaid,
      paymentId:      booking.paymentId ?? null,
    });
  } catch (err) {
    console.error("[student/bookings/receipt]", err);
    res.status(500).json({ error: "Failed to fetch receipt." });
  }
});

// Task 7.1 — POST /api/student/bookings/:id/renew (Req 4.1, 4.2, 4.3, 4.4)
router.post("/bookings/:id/renew", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();

    const original = await BookingModel.findById(req.params.id).lean();
    if (!original) {
      res.status(404).json({ error: "Booking not found." });
      return;
    }
    if (original.studentId.toString() !== user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Req 4.3 — only ACTIVE or EXPIRED bookings can be renewed
    if (original.status !== "ACTIVE" && original.status !== "EXPIRED") {
      res.status(409).json({ error: "Only active or recently expired bookings can be renewed." });
      return;
    }

    const { plan } = req.body as { plan?: "MONTHLY" | "QUARTERLY" | "ANNUAL" };
    if (!plan || !["MONTHLY", "QUARTERLY", "ANNUAL"].includes(plan)) {
      res.status(400).json({ error: "A valid plan (MONTHLY, QUARTERLY, ANNUAL) is required." });
      return;
    }

    // Req 4.4 — check slot availability if applicable
    if (original.slotId) {
      const slot = await SlotModel.findById(original.slotId).lean();
      if (!slot || slot.availableSeats <= 0) {
        res.status(409).json({ error: "Seat no longer available. Please book a new slot." });
        return;
      }
    }

    const library = await LibraryModel.findById(original.libraryId).lean();
    if (!library) {
      res.status(404).json({ error: "Library not found." });
      return;
    }

    // Req 4.1 — new startDate = oldBooking.endDate + 1 day
    const addMonths = (date: Date, months: number): Date => {
      const d = new Date(date);
      d.setMonth(d.getMonth() + months);
      return d;
    };

    const startDate = new Date(original.endDate);
    startDate.setDate(startDate.getDate() + 1);

    const endDate =
      plan === "QUARTERLY" ? addMonths(startDate, 3)
      : plan === "ANNUAL"  ? addMonths(startDate, 12)
      :                       addMonths(startDate, 1);

    // Compute fees using the same logic as create-order
    const { priceBooking } = await import("../lib/pricing");
    const planFee =
      plan === "QUARTERLY" ? (library.quarterlyFee ?? library.monthlyFee * 3)
      : plan === "ANNUAL"  ? (library.annualFee   ?? library.monthlyFee * 12)
      :                       library.monthlyFee;
    const { libraryFee, platformFee, total } = priceBooking(planFee);

    // Create Razorpay order (same pattern as POST /api/bookings/create-order)
    let razorpayOrderId: string;
    let razorpayKeyId: string | undefined;

    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const Razorpay = (await import("razorpay")).default;
      const rzp = new Razorpay({
        key_id:     process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const order = await rzp.orders.create({
        amount:   total * 100,
        currency: "INR",
        receipt:  `renew_${Date.now()}`,
      });
      razorpayOrderId = order.id;
      razorpayKeyId   = process.env.RAZORPAY_KEY_ID;
    } else {
      razorpayOrderId = `mock_order_${Date.now()}`;
    }

    // Create the new (PENDING) booking — confirmed via existing /api/bookings/confirm
    const newBooking = await BookingModel.create({
      studentId:       user.id,
      libraryId:       original.libraryId,
      slotId:          original.slotId ?? undefined,
      startDate,
      endDate,
      plan,
      libraryFee,
      platformFee,
      amountPaid:      total,
      paymentStatus:   "PENDING",
      razorpayOrderId,
      seatNumber:      original.seatNumber,
    });

    res.json({
      bookingId:         String(newBooking._id),
      razorpay_order_id: razorpayOrderId,
      razorpay_key_id:   razorpayKeyId,
      amount:            total,
      library_fee:       libraryFee,
      platform_fee:      platformFee,
      currency:          "INR",
      library_name:      library.name,
      plan,
      start_date:        startDate.toISOString(),
      end_date:          endDate.toISOString(),
    });
  } catch (err) {
    console.error("[student/bookings/renew]", err);
    res.status(500).json({ error: "Failed to create renewal order." });
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

// ─── WAITLIST ─────────────────────────────────────────────────────────────
router.post("/waitlist", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const studentId = new mongoose.Types.ObjectId(user.id);

    const { libraryId, slotId } = req.body as { libraryId?: string; slotId?: string };
    if (!libraryId || !slotId) {
      res.status(400).json({ error: "libraryId and slotId are required." });
      return;
    }

    const libOid = new mongoose.Types.ObjectId(libraryId);
    const slotOid = new mongoose.Types.ObjectId(slotId);

    const existing = await WaitlistModel.findOne({
      studentId,
      libraryId: libOid,
      slotId: slotOid,
    });
    if (existing) {
      res.status(409).json({ error: "You are already on this waitlist." });
      return;
    }

    const position =
      (await WaitlistModel.countDocuments({ libraryId: libOid, slotId: slotOid })) + 1;

    const entry = await WaitlistModel.create({
      studentId,
      libraryId: libOid,
      slotId: slotOid,
      position,
    });

    const populated = await WaitlistModel.findById(entry._id)
      .populate("libraryId", "name city")
      .populate("slotId", "name startTime endTime")
      .lean();

    res.status(201).json({ entry: populated });
  } catch (err) {
    console.error("[student/waitlist POST]", err);
    res.status(500).json({ error: "Failed to join waitlist." });
  }
});

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

// ─── WISHLIST (Task 14.1 — Req 9.1, 9.2, 9.3, 9.4, 9.6) ──────────────────
// Auth is already enforced by router.use(requireAuth) above (satisfies Req 9.6).

// POST /api/student/wishlist — add a library to the wishlist
router.post("/wishlist", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const studentId = new mongoose.Types.ObjectId(user.id);
    const { libraryId } = req.body as { libraryId?: string };

    if (!libraryId) {
      res.status(400).json({ error: "libraryId is required." });
      return;
    }

    const libOid = new mongoose.Types.ObjectId(libraryId);

    // Req 9.2 — prevent duplicates
    const student = await UserModel.findOne({ _id: studentId, wishlist: libOid }).lean();
    if (student) {
      res.status(409).json({ error: "Library already in wishlist." });
      return;
    }

    await UserModel.findByIdAndUpdate(studentId, { $push: { wishlist: libOid } });

    res.status(201).json({ success: true, libraryId });
  } catch (err) {
    console.error("[student/wishlist POST]", err);
    res.status(500).json({ error: "Failed to add to wishlist." });
  }
});

// DELETE /api/student/wishlist/:libraryId — remove a library from the wishlist
router.delete("/wishlist/:libraryId", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const studentId = new mongoose.Types.ObjectId(user.id);
    const libOid = new mongoose.Types.ObjectId(req.params.libraryId);

    await UserModel.findByIdAndUpdate(studentId, { $pull: { wishlist: libOid } });

    res.json({ success: true });
  } catch (err) {
    console.error("[student/wishlist DELETE]", err);
    res.status(500).json({ error: "Failed to remove from wishlist." });
  }
});

// GET /api/student/wishlist — list saved libraries with full card fields
router.get("/wishlist", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const studentId = new mongoose.Types.ObjectId(user.id);

    const student = await UserModel.findById(studentId)
      .populate("wishlist", "name city monthlyFee ratingAvg availableSeats facilities photos")
      .lean();

    if (!student) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.json({ wishlist: student.wishlist ?? [] });
  } catch (err) {
    console.error("[student/wishlist GET]", err);
    res.status(500).json({ error: "Failed to fetch wishlist." });
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
    const LibraryModelDyn = (await import("../models/Library")).default;
    const [agg] = await ReviewModel.aggregate([
      { $match: { libraryId: booking.libraryId } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    if (agg) {
      await LibraryModelDyn.findByIdAndUpdate(booking.libraryId, {
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

export default router;
