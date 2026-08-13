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

// ─── BOOKINGS ─────────────────────────────────────────────────────────────
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
