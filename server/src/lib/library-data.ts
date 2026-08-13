/**
 * Server-side data helpers for library detail pages.
 * Called directly in Server Components — NO fetch() over HTTP.
 *
 * Strategy:
 *  1. If MONGODB_URI is set → try Mongoose queries
 *  2. If MongoDB is unavailable or URI is missing → fall back to mock data
 */

import {
  libraryDetails,
  libraryReviews,
  librarySlots,
  type LibraryDetail,
  type Review,
  type Slot,
} from "./mock-data";

// ─── Normalised shapes used by LibraryDetailClient ───────────────────────────

export type NormLibrary = {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
  totalSeats: number;
  availableSeats: number;
  monthlyFee: number;
  quarterlyFee?: number | null;
  annualFee?: number | null;
  facilities: string[];
  studentTypes: string[];
  photos: { url: string; isCover: boolean; order: number }[];
  ratingAvg: number;
  reviewCount: number;
  whatsapp?: string;
  contactEmail?: string;
  contactPhone?: string;
};

export type NormSlot = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  totalSeats: number;
  availableSeats: number;
};

export type NormReview = {
  id: string;
  studentName?: string;
  studentId?: { name: string; avatarUrl?: string };
  rating: number;
  comment?: string;
  isVerified: boolean;
  date?: string;
  createdAt?: string;
};

// ─── Mock-data adapters ───────────────────────────────────────────────────────

function normaliseMockLibrary(lib: LibraryDetail): NormLibrary {
  return {
    id: lib.id,
    name: lib.name,
    description: lib.description,
    address: lib.address,
    city: lib.city,
    district: lib.district,
    state: lib.state,
    pincode: lib.pincode,
    totalSeats: lib.totalSeats,
    availableSeats: lib.availableSeats,
    monthlyFee: lib.fees.monthly,
    quarterlyFee: lib.fees.quarterly,
    annualFee: lib.fees.annual,
    facilities: lib.facilities,
    studentTypes: lib.studentTypes,
    photos: [],          // mock data has no photos — gallery shows gradient fallback
    ratingAvg: lib.rating,
    reviewCount: lib.reviewCount,
  };
}

function normaliseMockSlots(slots: Slot[]): NormSlot[] {
  return slots.map((s) => ({
    id: s.id,
    name: s.name,
    startTime: s.startTime,
    endTime: s.endTime,
    totalSeats: s.totalSeats,
    availableSeats: s.availableSeats,
  }));
}

function normaliseMockReviews(reviews: Review[]): NormReview[] {
  return reviews.map((r) => ({
    id: r.id,
    studentName: r.studentName,
    rating: r.rating,
    comment: r.comment,
    isVerified: r.isVerified,
    date: r.date,
  }));
}

// ─── MongoDB helpers (only imported when URI is present) ─────────────────────

async function fetchFromMongo(id: string): Promise<{
  library: NormLibrary;
  slots: NormSlot[];
  reviews: NormReview[];
  reviewTotal: number;
} | null> {
  // Dynamic import keeps mongoose out of the bundle when not needed
  const { default: connectDB } = await import("./mongodb");
  const { default: LibraryModel } = await import("../models/Library");
  const { default: SlotModel } = await import("../models/Slot");
  const { default: ReviewModel } = await import("../models/Review");
  const mongoose = await import("mongoose");

  await connectDB();

  // params.id might be a MongoDB ObjectId OR a slug-style string
  // Try ObjectId first; if it's not a valid ObjectId treat as not-found from Mongo
  let libraryDoc;
  if (mongoose.default.isValidObjectId(id)) {
    libraryDoc = await LibraryModel.findById(id)
      .populate("ownerId", "name phone email")
      .lean();
  }

  if (!libraryDoc) return null;

  const [slotDocs, reviewDocs, reviewTotal] = await Promise.all([
    SlotModel.find({ libraryId: libraryDoc._id }).lean(),
    ReviewModel.find({ libraryId: libraryDoc._id })
      .populate("studentId", "name avatarUrl")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    ReviewModel.countDocuments({ libraryId: libraryDoc._id }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lib = libraryDoc as any;

  const library: NormLibrary = {
    id: String(lib._id),
    name: lib.name,
    description: lib.description,
    address: lib.address,
    city: lib.city,
    district: lib.district,
    state: lib.state,
    pincode: lib.pincode,
    lat: lib.lat,
    lng: lib.lng,
    totalSeats: lib.totalSeats,
    availableSeats: lib.availableSeats,
    monthlyFee: lib.monthlyFee,
    quarterlyFee: lib.quarterlyFee ?? null,
    annualFee: lib.annualFee ?? null,
    facilities: lib.facilities ?? [],
    studentTypes: lib.studentTypes ?? [],
    photos: lib.photos ?? [],
    ratingAvg: lib.ratingAvg ?? 0,
    reviewCount: lib.reviewCount ?? 0,
    whatsapp: lib.whatsapp,
    contactEmail: lib.contactEmail,
    contactPhone: lib.contactPhone,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slots: NormSlot[] = slotDocs.map((s: any) => ({
    id: String(s._id),
    name: s.name,
    startTime: s.startTime,
    endTime: s.endTime,
    totalSeats: s.totalSeats,
    availableSeats: s.availableSeats,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviews: NormReview[] = reviewDocs.map((r: any) => ({
    id: String(r._id),
    studentName: r.studentId?.name,
    studentId: r.studentId
      ? { name: r.studentId.name, avatarUrl: r.studentId.avatarUrl }
      : undefined,
    rating: r.rating,
    comment: r.comment,
    isVerified: r.isVerified ?? true,
    createdAt: r.createdAt?.toISOString(),
  }));

  return { library, slots, reviews, reviewTotal };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type LibraryPageData = {
  library: NormLibrary;
  slots: NormSlot[];
  reviews: NormReview[];
  reviewTotal: number;
};

export async function getLibraryPageData(
  id: string
): Promise<LibraryPageData | null> {
  // 1. Try MongoDB if URI is configured
  if (process.env.MONGODB_URI) {
    try {
      const result = await fetchFromMongo(id);
      if (result) return result;
      // MongoDB connected but no doc found for this id →
      // could still be a mock-data slug, fall through
    } catch (err) {
      console.warn("[getLibraryPageData] MongoDB error, falling back to mock:", err);
    }
  }

  // 2. Fall back to mock data (slug-based id)
  const lib = libraryDetails[id];
  if (!lib) return null;

  return {
    library: normaliseMockLibrary(lib),
    slots: normaliseMockSlots(librarySlots[id] ?? []),
    reviews: normaliseMockReviews(libraryReviews[id] ?? []),
    reviewTotal: (libraryReviews[id] ?? []).length,
  };
}
