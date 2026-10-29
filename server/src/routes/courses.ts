import { Router, Request, Response } from "express";

import connectDB from "../lib/mongodb";
import CourseModel from "../models/Course";
import StudentCourseModel from "../models/StudentCourse";
import { requireAuth } from "../middleware/auth";

const router = Router();

// ── GET /api/courses ──────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();
    const examType = req.query.examType as string | undefined;
    const topRated = req.query.topRated as string | undefined;

    const filter: Record<string, unknown> = {};
    if (examType && examType !== "all") {
      filter.examTypes = examType;
    }
    if (topRated === "true") {
      filter.isTopRated = true;
    }

    let courses = await CourseModel.find(filter)
      .populate("createdBy", "name")
      .sort({ enrolledCount: -1, createdAt: -1 })
      .lean();

    // If topRated was requested but none explicitly marked, fall back to top enrolled
    if (topRated === "true" && (!courses || courses.length === 0)) {
      courses = await CourseModel.find(examType && examType !== "all" ? { examTypes: examType } : {})
        .populate("createdBy", "name")
        .sort({ enrolledCount: -1, createdAt: -1 })
        .limit(6)
        .lean();
    }

    res.json({ courses });
  } catch (err) {
    console.error("[courses]", err);
    res.status(500).json({ error: "Failed to fetch courses." });
  }
});

// ── POST /api/courses/:id/enroll ──────────────────────────────────────────
router.post("/:id/enroll", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.sessionUser!;
    await connectDB();

    const existing = await StudentCourseModel.findOne({ studentId: user.id, courseId: req.params.id });
    if (existing) { res.status(409).json({ error: "Already enrolled." }); return; }

    await StudentCourseModel.create({ studentId: user.id, courseId: req.params.id });
    await CourseModel.findByIdAndUpdate(req.params.id, { $inc: { enrolledCount: 1 } });

    res.json({ success: true });
  } catch (err) {
    console.error("[courses/enroll]", err);
    res.status(500).json({ error: "Failed to enroll." });
  }
});

export default router;
