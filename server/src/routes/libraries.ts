import { Router, Request, Response } from "express";
import mongoose from "mongoose";

import connectDB from "../lib/mongodb";
import LibraryModel from "../models/Library";
import ReviewModel from "../models/Review";
import SlotModel from "../models/Slot";

const router = Router();

function withLocation(body: Record<string, unknown>): Record<string, unknown> {
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { ...body, location: { type: "Point", coordinates: [lng, lat] } };
  }
  return body;
}

/**
 * True when the request failed because the database was unreachable, as
 * opposed to a bug in the handler. Used only to pick 503 over 500 — it must
 * never be used to substitute mock data for real data.
 */
function isDatabaseUnavailable(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof mongoose.Error) return true;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    const code = (err as { code?: string }).code;
    return (
      msg.includes("mongodb_uri") ||
      msg.includes("enotfound") ||
      msg.includes("econnrefused") ||
      msg.includes("querysrv") ||
      msg.includes("timed out") ||
      msg.includes("serverselection") ||
      msg.includes("topology") ||
      code === "ENOTFOUND" ||
      code === "ECONNREFUSED" ||
      err.name === "MongoServerSelectionError" ||
      err.name === "MongoNetworkError" ||
      err.name === "MongoTimeoutError"
    );
  }
  return false;
}

// ── GET /api/libraries ────────────────────────────────────────────────────
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const {
    city, state, district, exam_type,
    facilities: facilitiesRaw, min_rating, fee_min, fee_max,
    available_only, sort = "relevance", page = "1", limit = "12",
  } = req.query as Record<string, string | undefined>;

  const facilities = facilitiesRaw ? facilitiesRaw.split(",").filter(Boolean) : [];

  try {
    await connectDB();

    const filter: Record<string, unknown> = { isActive: true };
    if (city)     filter.city     = { $regex: new RegExp(`^${city}$`, "i") };
    if (state)    filter.state    = { $regex: new RegExp(`^${state}$`, "i") };
    if (district) filter.district = { $regex: new RegExp(`^${district}$`, "i") };

    if (fee_min || fee_max) {
      filter.monthlyFee = {
        ...(fee_min ? { $gte: Number(fee_min) } : {}),
        ...(fee_max ? { $lte: Number(fee_max) } : {}),
      };
    }
    if (min_rating) filter.ratingAvg = { $gte: Number(min_rating) };
    if (available_only === "true") filter.availableSeats = { $gt: 0 };

    const EXAM_TYPE_MAP: Record<string, string> = {
      "govt-exam": "Govt Exam",
      "entrance-exam": "Entrance Exam",
      school: "School",
      professional: "Professional",
    };
    if (exam_type) filter.studentTypes = EXAM_TYPE_MAP[exam_type] ?? exam_type;
    if (facilities.length > 0) filter.facilities = { $all: facilities };

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      relevance:  { ratingAvg: -1, reviewCount: -1 },
      rating:     { ratingAvg: -1 },
      "fee-asc":  { monthlyFee: 1 },
      "fee-desc": { monthlyFee: -1 },
      newest:     { createdAt: -1 },
      seats:      { availableSeats: -1 },
    };
    const sortObj = sortMap[sort as string] ?? sortMap.relevance;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [docs, total] = await Promise.all([
      LibraryModel.find(filter).populate("ownerId", "name phone email").sort(sortObj).skip(skip).limit(limitNum).lean(),
      LibraryModel.countDocuments(filter),
    ]);

    res.json({ libraries: docs, total, page: pageNum, totalPages: Math.max(1, Math.ceil(total / limitNum)) });
  } catch (err) {
    if (isDatabaseUnavailable(err)) {
      console.error("[libraries GET] database unavailable", err);
      res.status(503).json({ error: "Service temporarily unavailable." });
      return;
    }
    console.error("[libraries]", err);
    res.status(500).json({ error: "Failed to fetch libraries." });
  }
});

// ── GET /api/libraries/map ───────────────────────────────────────────────
router.get("/map", async (req: Request, res: Response): Promise<void> => {
  const { examType, exam_type, available_only, lat, lng, radius } =
    req.query as Record<string, string | undefined>;

  try {
    await connectDB();
    const filter: Record<string, unknown> = { isActive: true };
    const requestedExamType = examType ?? exam_type;
    if (requestedExamType) filter.studentTypes = requestedExamType;
    if (available_only === "true") filter.availableSeats = { $gt: 0 };

    const latitude = Number(lat);
    const longitude = Number(lng);
    const distance = Number(radius);
    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      Number.isFinite(distance) &&
      distance > 0
    ) {
      filter.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
          $maxDistance: distance * 1000,
        },
      };
    }

    const libraries = await LibraryModel.find(
      filter,
      "name city lat lng availableSeats ratingAvg monthlyFee photos"
    ).lean();
    res.json({ libraries });
  } catch (err) {
    console.error("[libraries/map]", err);
    res.status(500).json({ error: "Failed to fetch map libraries." });
  }
});

// ── POST /api/libraries ───────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();
    const body = req.body as Record<string, unknown>;
    if (!body.ownerId || !body.name || !body.address || !body.city) {
      res.status(400).json({ error: "ownerId, name, address, and city are required." });
      return;
    }
    const library = await LibraryModel.create(withLocation(body));
    res.status(201).json({ library });
  } catch (err) {
    console.error("[libraries POST]", err);
    res.status(500).json({ error: "Failed to create library." });
  }
});

// ── GET /api/libraries/:id ────────────────────────────────────────────────
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();
    const library = await LibraryModel.findById(req.params.id).populate("ownerId", "name phone email").lean();
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }
    res.json({ library });
  } catch (err) {
    if (isDatabaseUnavailable(err)) {
      console.error("[library GET] database unavailable", err);
      res.status(503).json({ error: "Service temporarily unavailable." });
      return;
    }
    console.error("[library GET]", err);
    res.status(500).json({ error: "Failed to fetch library." });
  }
});

// ── PUT /api/libraries/:id ────────────────────────────────────────────────
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();
    const library = await LibraryModel.findByIdAndUpdate(req.params.id, withLocation(req.body), { new: true, runValidators: true });
    if (!library) { res.status(404).json({ error: "Library not found." }); return; }
    res.json({ library });
  } catch (err) {
    console.error("[library PUT]", err);
    res.status(500).json({ error: "Failed to update library." });
  }
});

// ── GET /api/libraries/:id/reviews ───────────────────────────────────────
router.get("/:id/reviews", async (req: Request, res: Response): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 5);
  const skip = (page - 1) * limit;
  try {
    await connectDB();
    const [reviews, total] = await Promise.all([
      ReviewModel.find({ libraryId: req.params.id }).populate("studentId", "name avatarUrl").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ReviewModel.countDocuments({ libraryId: req.params.id }),
    ]);
    res.json({ reviews, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    if (isDatabaseUnavailable(err)) {
      console.error("[reviews GET] database unavailable", err);
      res.status(503).json({ error: "Service temporarily unavailable." });
      return;
    }
    console.error("[reviews GET]", err);
    res.status(500).json({ error: "Failed to fetch reviews." });
  }
});

// ── GET /api/libraries/:id/slots ──────────────────────────────────────────
router.get("/:id/slots", async (req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();
    const slots = await SlotModel.find({ libraryId: req.params.id }).lean();
    res.json({ slots });
  } catch (err) {
    if (isDatabaseUnavailable(err)) {
      console.error("[slots GET] database unavailable", err);
      res.status(503).json({ error: "Service temporarily unavailable." });
      return;
    }
    console.error("[slots GET]", err);
    res.status(500).json({ error: "Failed to fetch slots." });
  }
});

export default router;
