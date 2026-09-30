"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GitCompareArrows } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import {
  ComparisonTable,
  type LibraryData,
} from "@/components/library/ComparisonTable";
import { api } from "@/lib/api";

// --- Types -------------------------------------------------------------------

// Raw shape returned by GET /api/libraries/:id
interface RawLibrary {
  _id?: string;
  id?: string;
  name: string;
  city: string;
  monthlyFee: number;
  quarterlyFee?: number | null;
  annualFee?: number | null;
  totalSeats: number;
  availableSeats: number;
  ratingAvg?: number;
  reviewCount?: number;
  facilities?: string[];
  studentTypes?: string[];
  contactPhone?: string;
  contactEmail?: string;
  whatsapp?: string;
}

interface LibraryApiResponse {
  library: RawLibrary;
}

// --- Mapper ------------------------------------------------------------------

function mapToLibraryData(raw: RawLibrary): LibraryData {
  return {
    id: String(raw._id ?? raw.id ?? ""),
    name: raw.name,
    city: raw.city,
    monthlyFee: raw.monthlyFee,
    quarterlyFee: raw.quarterlyFee ?? null,
    annualFee: raw.annualFee ?? null,
    totalSeats: raw.totalSeats,
    availableSeats: raw.availableSeats,
    ratingAvg: raw.ratingAvg ?? 0,
    reviewCount: raw.reviewCount ?? 0,
    facilities: raw.facilities ?? [],
    studentTypes: raw.studentTypes ?? [],
    contactPhone: raw.contactPhone,
    contactEmail: raw.contactEmail,
    whatsapp: raw.whatsapp,
  };
}

// --- Loading skeleton --------------------------------------------------------

function ComparisonSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-card border border-line bg-white/80 p-6 shadow-soft"
        >
          {/* Header */}
          <div className="mb-4 h-7 w-3/4 rounded-lg bg-sage-100" />
          <div className="mb-6 h-4 w-1/2 rounded-lg bg-sage-100" />
          {/* Rows */}
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="mb-3 flex justify-between">
              <div className="h-4 w-1/3 rounded bg-sage-100" />
              <div className="h-4 w-1/4 rounded bg-sage-100" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// --- Page --------------------------------------------------------------------

/**
 * /student/compare?ids={id1},{id2}
 *
 * Reads two library IDs from the `ids` query param, fetches them in parallel,
 * and renders a side-by-side ComparisonTable.
 *
 * Requirements: 10.1, 10.5
 */
export default function ComparePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [libraries, setLibraries] = useState<LibraryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse IDs from search params
  const idsParam = searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const fetchLibraries = useCallback(async (libraryIds: string[]) => {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const [resA, resB] = await Promise.all([
        api.get<LibraryApiResponse>(`/libraries/${libraryIds[0]}`),
        api.get<LibraryApiResponse>(`/libraries/${libraryIds[1]}`),
      ]);
      setLibraries([mapToLibraryData(resA.library), mapToLibraryData(resB.library)]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load library details."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ids.length !== 2) return;
    const libraryIds = ids;
    void (async () => {
      await Promise.resolve();
      setLoading(true);
      setError(null);
      try {
        const [resA, resB] = await Promise.all([
          api.get<LibraryApiResponse>(`/libraries/${libraryIds[0]}`),
          api.get<LibraryApiResponse>(`/libraries/${libraryIds[1]}`),
        ]);
        setLibraries([mapToLibraryData(resA.library), mapToLibraryData(resB.library)]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load library details."
        );
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsParam]);

  // --- Render ---------------------------------------------------------------

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/student/wishlist"
            className="inline-flex items-center gap-1.5 text-sm text-forest-900/60 transition hover:text-forest-900"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to Wishlist
          </Link>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#16a34a]/10">
            <GitCompareArrows className="size-5 text-[#16a34a]" aria-hidden />
          </div>
          <div>
            <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
              Compare Libraries
            </h1>
            <p className="mt-0.5 text-sm text-forest-900/60">
              Side-by-side comparison to help you decide
            </p>
          </div>
        </div>
      </AnimatedContent>

      {/* Body */}
      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
        {/* Guard: must have exactly 2 IDs in the URL */}
        {ids.length !== 2 ? (
          <div className="rounded-card border border-dashed border-line bg-white/80 px-6 py-10 text-center shadow-soft">
            <GitCompareArrows className="mx-auto mb-3 size-8 text-forest-900/20" aria-hidden />
            <p className="text-sm font-semibold text-forest-900">
              Select exactly 2 libraries to compare.
            </p>
            <p className="mt-1 text-xs text-forest-900/50">
              Go to your{" "}
              <button
                type="button"
                className="text-[#16a34a] underline-offset-2 hover:underline"
                onClick={() => router.push("/student/wishlist")}
              >
                Wishlist
              </button>{" "}
              and select two libraries.
            </p>
          </div>
        ) : loading ? (
          <ComparisonSkeleton />
        ) : error ? (
          <div className="rounded-card border border-dashed border-red-200 bg-red-50/60 px-6 py-10 text-center shadow-soft">
            <p className="text-sm font-semibold text-red-700">
              Could not load libraries
            </p>
            <p className="mt-1 text-xs text-red-600/80">{error}</p>
            <button
              type="button"
              onClick={() => void fetchLibraries(ids)}
              className="mt-4 text-xs font-semibold text-[#16a34a] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : libraries.length === 2 ? (
          <ComparisonTable libraries={libraries} />
        ) : null}
      </AnimatedContent>
    </div>
  );
}
