/**
 * Server-side data helpers for the library detail page (Server Component).
 *
 * Fetches from the Express API server via internal HTTP.
 * Errors propagate to the caller — a failed fetch must not look like a
 * successful one with no results.
 */


// ─── Normalised shapes ────────────────────────────────────────────────────────

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

export type LibraryPageData = {
  library: NormLibrary;
  slots: NormSlot[];
  reviews: NormReview[];
  reviewTotal: number;
};

// ─── Mock-data adapters ───────────────────────────────────────────────────────




// ─── API fetch ────────────────────────────────────────────────────────────────

async function fetchFromAPI(id: string): Promise<LibraryPageData | null> {
  // In Server Components this runs on the server — call the Express API directly.
  // next.config.ts rewrites don't apply to server-side fetches, so we use the
  // API server URL directly.
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:5000";

  const [libRes, slotsRes, reviewsRes] = await Promise.all([
    fetch(`${apiBase}/api/libraries/${id}`, { cache: "no-store" }),
    fetch(`${apiBase}/api/libraries/${id}/slots`, { cache: "no-store" }),
    fetch(`${apiBase}/api/libraries/${id}/reviews?limit=5`, { cache: "no-store" }),
  ]);

  // 404 means the library genuinely does not exist, so the caller renders
  // notFound(). Anything else is our failure, not a missing record, and must
  // not be disguised as one.
  if (libRes.status === 404) return null;
  if (!libRes.ok) {
    throw new Error(`Library request failed with status ${libRes.status}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const libData = (await libRes.json()) as { library: any };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slotsData = slotsRes.ok ? ((await slotsRes.json()) as { slots: any[] }) : { slots: [] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviewsData = reviewsRes.ok ? ((await reviewsRes.json()) as { reviews: any[]; total: number }) : { reviews: [], total: 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lib = libData.library as any;

  const library: NormLibrary = {
    id: String(lib._id ?? lib.id),
    name: lib.name, description: lib.description,
    address: lib.address, city: lib.city, district: lib.district,
    state: lib.state, pincode: lib.pincode, lat: lib.lat, lng: lib.lng,
    totalSeats: lib.totalSeats, availableSeats: lib.availableSeats,
    monthlyFee: lib.monthlyFee, quarterlyFee: lib.quarterlyFee ?? null, annualFee: lib.annualFee ?? null,
    facilities: lib.facilities ?? [], studentTypes: lib.studentTypes ?? [],
    photos: lib.photos ?? [], ratingAvg: lib.ratingAvg ?? 0, reviewCount: lib.reviewCount ?? 0,
    whatsapp: lib.whatsapp, contactEmail: lib.contactEmail, contactPhone: lib.contactPhone,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slots: NormSlot[] = slotsData.slots.map((s: any) => ({
    id: String(s._id ?? s.id), name: s.name, startTime: s.startTime,
    endTime: s.endTime, totalSeats: s.totalSeats, availableSeats: s.availableSeats,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviews: NormReview[] = reviewsData.reviews.map((r: any) => ({
    id: String(r._id ?? r.id),
    studentName: r.studentId?.name,
    studentId: r.studentId ? { name: r.studentId.name, avatarUrl: r.studentId.avatarUrl } : undefined,
    rating: r.rating, comment: r.comment, isVerified: r.isVerified ?? true, createdAt: r.createdAt,
  }));

  return { library, slots, reviews, reviewTotal: reviewsData.total };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getLibraryPageData(id: string): Promise<LibraryPageData | null> {
  // Errors propagate on purpose. Serving mock data when the API is down made a
  // broken backend look like a working page, and meant the "loads real data"
  // acceptance criterion could never fail. A genuinely missing library returns
  // null so the caller can render notFound().
  return fetchFromAPI(id);
}
