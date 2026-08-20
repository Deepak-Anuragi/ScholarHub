import { Router, Request, Response } from "express";
import mongoose from "mongoose";

import connectDB from "../lib/mongodb";
import LibraryModel from "../models/Library";
import UserModel from "../models/User";
import BookingModel from "../models/Booking";
import PayoutLedgerModel from "../models/PayoutLedger";
import CourseModel from "../models/Course";
import NotificationModel from "../models/Notification";
import StudentCourseModel from "../models/StudentCourse";
import { requireAdmin } from "../middleware/auth";

const router = Router();
router.use(requireAdmin);

// ─── STATS ────────────────────────────────────────────────────────────────
router.get("/stats", async (_req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const twelveMonthStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [totalLibraries, verifiedLibraries, totalStudents, activeBookings, platformRevenueAgg, pendingPayouts, revenueChart, topCities, examDist] = await Promise.all([
      LibraryModel.countDocuments(),
      LibraryModel.countDocuments({ isVerified: true }),
      UserModel.countDocuments({ role: "STUDENT" }),
      BookingModel.countDocuments({ status: "ACTIVE" }),
      PayoutLedgerModel.aggregate([{ $match: { createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: "$platformShare" } } }]),
      PayoutLedgerModel.countDocuments({ payoutStatus: "PENDING" }),
      PayoutLedgerModel.aggregate([{ $match: { createdAt: { $gte: twelveMonthStart } } }, { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, total: { $sum: "$platformShare" } } }, { $sort: { "_id.year": 1, "_id.month": 1 } }]),
      LibraryModel.aggregate([{ $group: { _id: "$city", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      UserModel.aggregate([{ $match: { role: "STUDENT" } }, { $group: { _id: "$examType", count: { $sum: 1 } } }]),
    ]);

    const revenueMap = new Map(revenueChart.map((r: any) => [`${r._id.year}-${r._id.month}`, r.total as number]));
    const revenueChart12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      return { _id: { year, month }, total: revenueMap.get(`${year}-${month}`) ?? 0 };
    });

    res.json({ totalLibraries, verifiedLibraries, totalStudents, activeBookings, platformRevenue: platformRevenueAgg[0]?.total ?? 0, pendingPayouts, revenueChart: revenueChart12Months, topCities, examDist });
  } catch (err) {
    console.error("[admin/stats]", err);
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// ─── LIBRARIES ────────────────────────────────────────────────────────────
router.get("/libraries", async (req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();
    const { mode, state, district, city } = req.query as Record<string, string | undefined>;

    if (mode === "filters") {
      const distFilter: Record<string, string> = {};
      if (state) distFilter.state = state;
      const cityFilter: Record<string, string> = {};
      if (state) cityFilter.state = state;
      if (district) cityFilter.district = district;

      const [states, districts, cities] = await Promise.all([
        LibraryModel.distinct("state"),
        state ? LibraryModel.distinct("district", distFilter) : Promise.resolve([]),
        state && district ? LibraryModel.distinct("city", cityFilter) : Promise.resolve([]),
      ]);
      res.json({ states: (states as string[]).filter(Boolean).sort(), districts: (districts as string[]).filter(Boolean).sort(), cities: (cities as string[]).filter(Boolean).sort() });
      return;
    }

    const filter: Record<string, string> = {};
    if (state) filter.state = state;
    if (district) filter.district = district;
    if (city) filter.city = city;

    const libraries = await LibraryModel.find(filter).populate("ownerId", "name email phone").sort({ createdAt: -1 }).lean();

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const revenueAgg = await PayoutLedgerModel.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, libraryId: { $in: libraries.map((l: any) => l._id) } } },
      { $group: { _id: "$libraryId", monthlyRevenue: { $sum: "$totalAmount" } } },
    ]);
    const revenueMap = new Map(revenueAgg.map((r: any) => [String(r._id), r.monthlyRevenue as number]));

    const serialized = libraries.map((lib: any) => ({
      ...lib, _id: String(lib._id),
      monthlyRevenue: revenueMap.get(String(lib._id)) ?? 0,
      ownerId: lib.ownerId && typeof lib.ownerId === "object"
        ? { ...(lib.ownerId as Record<string, unknown>), _id: String((lib.ownerId as { _id: unknown })._id) }
        : lib.ownerId,
    }));

    res.json({ libraries: serialized });
  } catch (err) {
    console.error("[admin/libraries GET]", err);
    res.status(500).json({ error: "Failed to fetch libraries." });
  }
});

router.patch("/libraries", async (req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();
    const { action, ids } = req.body as { action?: "verify" | "suspend"; ids?: string[] };
    const update = action === "verify" ? { isVerified: true } : { isActive: false };
    const result = await LibraryModel.updateMany({ _id: { $in: ids } }, update);
    res.json({ modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error("[admin/libraries PATCH]", err);
    res.status(500).json({ error: "Bulk update failed." });
  }
});

router.patch("/libraries/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();
    const library = await LibraryModel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }
    res.json({ library: { ...library.toObject(), _id: String(library._id) } });
  } catch (err) {
    console.error("[admin/library PATCH]", err);
    res.status(500).json({ error: "Failed." });
  }
});

router.delete("/libraries/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();
    await LibraryModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("[admin/library DELETE]", err);
    res.status(500).json({ error: "Failed." });
  }
});

router.patch("/libraries/:id/verify", async (req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();
    const library = await LibraryModel.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }
    res.json({ library: { ...library.toObject(), _id: String(library._id) } });
  } catch (err) {
    console.error("[admin/libraries verify]", err);
    res.status(500).json({ error: "Failed to verify library." });
  }
});

router.patch("/libraries/:id/suspend", async (req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();
    const library = await LibraryModel.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }
    res.json({ library: { ...library.toObject(), _id: String(library._id) } });
  } catch (err) {
    console.error("[admin/libraries suspend]", err);
    res.status(500).json({ error: "Failed to suspend library." });
  }
});

// ─── STUDENTS ─────────────────────────────────────────────────────────────
router.get("/students", async (req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();
    const { city, examType } = req.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = { role: "STUDENT" };
    if (city) filter.city = city;
    if (examType) filter.examType = examType;

    const students = await UserModel.find(filter).select("-passwordHash").sort({ createdAt: -1 }).lean();
    const activeBookings = await BookingModel.find({ studentId: { $in: students.map((s: any) => s._id) }, status: "ACTIVE" }).populate("libraryId", "name city").lean();

    const bookingMap = new Map(activeBookings.map((b: any) => [String(b.studentId), b]));
    const result = students.map((s: any) => {
      const b = bookingMap.get(String(s._id)) as any;
      return {
        ...s, _id: String(s._id),
        activeBooking: b ? { ...b, _id: String(b._id), studentId: String(b.studentId), libraryId: b.libraryId && typeof b.libraryId === "object" ? { ...b.libraryId, _id: String(b.libraryId._id) } : b.libraryId ? String(b.libraryId) : null } : null,
      };
    });

    res.json({ students: result });
  } catch (err) {
    console.error("[admin/students]", err);
    res.status(500).json({ error: "Failed to fetch students." });
  }
});

// ─── REVENUE ──────────────────────────────────────────────────────────────
router.get("/revenue", async (_req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    const [ledger, monthAgg, yearAgg, allTimeAgg] = await Promise.all([
      PayoutLedgerModel.find().populate("libraryId", "name city").populate("ownerId", "name").sort({ createdAt: -1 }).lean(),
      PayoutLedgerModel.aggregate([{ $match: { createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, platform: { $sum: "$platformShare" }, owner: { $sum: "$ownerShare" } } }]),
      PayoutLedgerModel.aggregate([{ $match: { createdAt: { $gte: startOfYear } } }, { $group: { _id: null, platform: { $sum: "$platformShare" }, owner: { $sum: "$ownerShare" } } }]),
      PayoutLedgerModel.aggregate([{ $group: { _id: null, platform: { $sum: "$platformShare" }, total: { $sum: "$totalAmount" } } }]),
    ]);

    const serialized = ledger.map((row: any) => ({
      ...row, _id: String(row._id),
      bookingId: row.bookingId ? String(row.bookingId) : null,
      libraryId: row.libraryId && typeof row.libraryId === "object" ? { ...(row.libraryId as Record<string, unknown>), _id: String((row.libraryId as { _id: unknown })._id) } : row.libraryId ? String(row.libraryId) : null,
      ownerId: row.ownerId && typeof row.ownerId === "object" ? { ...(row.ownerId as Record<string, unknown>), _id: String((row.ownerId as { _id: unknown })._id) } : row.ownerId ? String(row.ownerId) : null,
    }));

    res.json({ ledger: serialized, thisMonth: { platform: monthAgg[0]?.platform ?? 0, owner: monthAgg[0]?.owner ?? 0 }, thisYear: { platform: yearAgg[0]?.platform ?? 0, owner: yearAgg[0]?.owner ?? 0 }, allTime: { platform: allTimeAgg[0]?.platform ?? 0, total: allTimeAgg[0]?.total ?? 0 } });
  } catch (err) {
    console.error("[admin/revenue]", err);
    res.status(500).json({ error: "Failed to fetch revenue." });
  }
});

// ─── PAYOUTS ──────────────────────────────────────────────────────────────
router.patch("/payouts/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();
    const payout = await PayoutLedgerModel.findByIdAndUpdate(req.params.id, { payoutStatus: "PAID", payoutDate: new Date() }, { new: true });
    if (!payout) { res.status(404).json({ error: "Payout not found." }); return; }
    res.json({ payout: { ...payout.toObject(), _id: String(payout._id) } });
  } catch (err) {
    console.error("[admin/payouts PATCH]", err);
    res.status(500).json({ error: "Failed to mark payout." });
  }
});

// ─── COURSES ──────────────────────────────────────────────────────────────
router.get("/courses", async (_req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();
    const courses = await CourseModel.find().populate("createdBy", "name").sort({ createdAt: -1 }).lean();
    res.json({ courses: courses.map((c: any) => ({ ...c, _id: String(c._id), createdBy: c.createdBy && typeof c.createdBy === "object" ? { ...(c.createdBy as Record<string, unknown>), _id: String((c.createdBy as { _id: unknown })._id) } : c.createdBy ? String(c.createdBy) : null })) });
  } catch (err) {
    console.error("[admin/courses GET]", err);
    res.status(500).json({ error: "Failed." });
  }
});

router.post("/courses", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();
    const course = await CourseModel.create({ ...req.body, createdBy: user.id });
    await course.populate("createdBy", "name");
    res.status(201).json({ course: { ...course.toObject(), _id: String(course._id), createdBy: course.createdBy && typeof course.createdBy === "object" ? { ...(course.createdBy as unknown as Record<string, unknown>), _id: String((course.createdBy as unknown as { _id: unknown })._id) } : String(course.createdBy) } });
  } catch (err) {
    console.error("[admin/courses POST]", err);
    res.status(500).json({ error: "Failed." });
  }
});

router.delete("/courses", async (req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();
    const { id } = req.body as { id?: string };
    await CourseModel.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    console.error("[admin/courses DELETE]", err);
    res.status(500).json({ error: "Failed." });
  }
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────
router.post("/notifications", async (req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();
    const { title, message, link, target = "ALL" } = req.body as { title?: string; message?: string; link?: string; target?: string };

    if (!title?.trim() || !message?.trim()) {
      res.status(400).json({ error: "Title and message are required." });
      return;
    }

    const userFilter = target === "ALL" ? {} : { role: target };
    const recipients = await UserModel.find(userFilter).select("_id").lean();
    if (recipients.length === 0) { res.json({ createdCount: 0 }); return; }

    const docs = await NotificationModel.insertMany(
      recipients.map((r: any) => ({ userId: r._id, type: "ADMIN_ANNOUNCEMENT", title: title.trim(), message: message.trim(), link: link?.trim() || undefined }))
    );

    res.json({ createdCount: docs.length, notificationIds: docs.map((d: any) => String(d._id)) });
  } catch (err) {
    console.error("[admin/notifications POST]", err);
    res.status(500).json({ error: "Failed to send notifications." });
  }
});

export default router;
