"use client";

import { Check, Phone, Mail, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types --------------------------------------------------------------------

export interface LibraryData {
  id: string;
  name: string;
  city: string;
  monthlyFee: number;
  quarterlyFee?: number | null;
  annualFee?: number | null;
  totalSeats: number;
  availableSeats: number;
  ratingAvg: number;
  reviewCount: number;
  facilities: string[];
  studentTypes: string[];
  contactPhone?: string;
  contactEmail?: string;
  whatsapp?: string;
}

export interface ComparisonTableProps {
  libraries: LibraryData[];
}

// --- Helpers ------------------------------------------------------------------

/** Returns indices of libraries that have the "better" (highlighted) value for a metric. */
function betterIndices(
  values: (number | null | undefined)[],
  direction: "lower" | "higher"
): number[] {
  const nums = values.map((v) => (v == null ? null : Number(v)));
  const defined = nums.filter((v): v is number => v !== null);
  if (defined.length < 2) return [];

  const target =
    direction === "lower" ? Math.min(...defined) : Math.max(...defined);

  // Only highlight when the two values actually differ
  const allSame = nums.every((v) => v === nums[0]);
  if (allSame) return [];

  return nums.reduce<number[]>((acc, v, i) => {
    if (v === target) acc.push(i);
    return acc;
  }, []);
}

function fmtCurrency(value: number | null | undefined): string {
  if (value == null || value === 0) return "—";
  return `₹${value.toLocaleString("en-IN")}`;
}

function fmtRating(value: number): string {
  return value > 0 ? value.toFixed(1) : "—";
}

// --- Row components -----------------------------------------------------------

function HeaderRow({ libraries }: { libraries: LibraryData[] }) {
  return (
    <div className="contents">
      {/* empty label cell */}
      <div className="sticky left-0 z-10 bg-white/95 px-4 py-3" />
      {libraries.map((lib) => (
        <div
          key={lib.id}
          className="bg-gradient-to-br from-[#16a34a] to-[#0f4c25] px-4 py-5 text-center"
        >
          <p className="font-display text-lg font-semibold leading-tight text-white">
            {lib.name}
          </p>
          <p className="mt-0.5 text-xs text-white/70">{lib.city}</p>
        </div>
      ))}
    </div>
  );
}

interface SimpleRowProps {
  label: string;
  values: React.ReactNode[];
  highlighted?: number[];
  zebra?: boolean;
}

function SimpleRow({ label, values, highlighted = [], zebra = false }: SimpleRowProps) {
  return (
    <div className="contents">
      <div
        className={cn(
          "sticky left-0 z-10 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-forest-900/60",
          zebra ? "bg-sage-100/50" : "bg-white/95"
        )}
      >
        {label}
      </div>
      {values.map((val, i) => (
        <div
          key={i}
          className={cn(
            "px-4 py-3 text-center text-sm font-medium text-forest-900",
            zebra ? "bg-sage-100/30" : "bg-white/80",
            highlighted.includes(i) && "font-semibold text-[#16a34a]"
          )}
        >
          {highlighted.includes(i) ? (
            <span className="inline-flex items-center justify-center gap-1">
              {val}
              <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#16a34a]/15 text-[10px] text-[#16a34a]">
                ★
              </span>
            </span>
          ) : (
            val
          )}
        </div>
      ))}
    </div>
  );
}

interface FacilitiesRowProps {
  libraries: LibraryData[];
  zebra?: boolean;
}

function FacilitiesRow({ libraries, zebra = false }: FacilitiesRowProps) {
  // Collect all unique facilities across both libraries
  const allFacilities = Array.from(
    new Set(libraries.flatMap((lib) => lib.facilities))
  ).sort();

  if (allFacilities.length === 0) {
    return (
      <SimpleRow
        label="Facilities"
        values={libraries.map((lib) => (
          <span key={lib.id} className="text-forest-900/30">
            None listed
          </span>
        ))}
        zebra={zebra}
      />
    );
  }

  return (
    <div className="contents">
      <div
        className={cn(
          "sticky left-0 z-10 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-forest-900/60",
          zebra ? "bg-sage-100/50" : "bg-white/95"
        )}
      >
        Facilities
      </div>
      {libraries.map((lib, i) => (
        <div
          key={i}
          className={cn(
            "px-4 py-3 text-sm",
            zebra ? "bg-sage-100/30" : "bg-white/80"
          )}
        >
          <ul className="space-y-1">
            {allFacilities.map((facility) => {
              const has = lib.facilities.includes(facility);
              return (
                <li
                  key={facility}
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    has ? "text-forest-900" : "text-forest-900/30 line-through"
                  )}
                >
                  {has ? (
                    <Check className="size-3.5 shrink-0 text-[#16a34a]" aria-hidden />
                  ) : (
                    <span className="size-3.5 shrink-0" aria-hidden />
                  )}
                  {facility}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

interface StudentTypesRowProps {
  libraries: LibraryData[];
  zebra?: boolean;
}

function StudentTypesRow({ libraries, zebra = false }: StudentTypesRowProps) {
  return (
    <div className="contents">
      <div
        className={cn(
          "sticky left-0 z-10 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-forest-900/60",
          zebra ? "bg-sage-100/50" : "bg-white/95"
        )}
      >
        Student Types
      </div>
      {libraries.map((lib, i) => (
        <div
          key={i}
          className={cn(
            "px-4 py-3",
            zebra ? "bg-sage-100/30" : "bg-white/80"
          )}
        >
          {lib.studentTypes.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-1">
              {lib.studentTypes.map((type) => (
                <span
                  key={type}
                  className="rounded-full bg-[#16a34a]/10 px-2 py-0.5 text-[10px] font-semibold text-[#16a34a]"
                >
                  {type}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-forest-900/30">—</span>
          )}
        </div>
      ))}
    </div>
  );
}

interface ContactRowProps {
  libraries: LibraryData[];
  zebra?: boolean;
}

function ContactRow({ libraries, zebra = false }: ContactRowProps) {
  return (
    <div className="contents">
      <div
        className={cn(
          "sticky left-0 z-10 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-forest-900/60",
          zebra ? "bg-sage-100/50" : "bg-white/95"
        )}
      >
        Contact
      </div>
      {libraries.map((lib, i) => (
        <div
          key={i}
          className={cn(
            "px-4 py-3 text-xs",
            zebra ? "bg-sage-100/30" : "bg-white/80"
          )}
        >
          <ul className="space-y-1.5 text-center">
            {lib.contactPhone && (
              <li className="inline-flex items-center gap-1.5 text-forest-900/80">
                <Phone className="size-3 text-[#16a34a]" aria-hidden />
                <span>{lib.contactPhone}</span>
              </li>
            )}
            {lib.contactEmail && (
              <li className="inline-flex items-center gap-1.5 text-forest-900/80">
                <Mail className="size-3 text-[#16a34a]" aria-hidden />
                <a
                  href={`mailto:${lib.contactEmail}`}
                  className="hover:underline"
                >
                  {lib.contactEmail}
                </a>
              </li>
            )}
            {lib.whatsapp && (
              <li className="inline-flex items-center gap-1.5 text-forest-900/80">
                <MessageCircle className="size-3 text-[#16a34a]" aria-hidden />
                <span>{lib.whatsapp}</span>
              </li>
            )}
            {!lib.contactPhone && !lib.contactEmail && !lib.whatsapp && (
              <li className="text-forest-900/30">—</li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}

// --- Main component -----------------------------------------------------------

/**
 * ComparisonTable renders two libraries side-by-side in a comparison grid.
 * When `libraries.length !== 2`, an inline error is shown instead.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */
export function ComparisonTable({ libraries }: ComparisonTableProps) {
  // Requirement 10.4 — guard: must have exactly 2 libraries
  if (libraries.length !== 2) {
    return (
      <div className="rounded-card border border-dashed border-line bg-white/80 px-6 py-10 text-center shadow-soft">
        <p className="text-sm font-semibold text-forest-900">
          Select exactly 2 libraries to compare.
        </p>
      </div>
    );
  }

  const [a, b] = libraries;

  // Pre-compute which library wins on each numeric metric (Req 10.3)
  const betterMonthly     = betterIndices([a.monthlyFee, b.monthlyFee], "lower");
  const betterQuarterly   = betterIndices([a.quarterlyFee, b.quarterlyFee], "lower");
  const betterAnnual      = betterIndices([a.annualFee, b.annualFee], "lower");
  const betterAvailSeats  = betterIndices([a.availableSeats, b.availableSeats], "higher");
  const betterRating      = betterIndices([a.ratingAvg, b.ratingAvg], "higher");
  const betterReviews     = betterIndices([a.reviewCount, b.reviewCount], "higher");

  return (
    <div className="overflow-x-auto rounded-card border border-line shadow-soft">
      {/*
        CSS grid approach: 3 columns — label | lib-A | lib-B.
        The `contents` trick on each row group lets child elements participate
        in the parent grid without an extra wrapper element.
      */}
      <div
        className="grid"
        style={{ gridTemplateColumns: "minmax(120px, 0.8fr) 1fr 1fr" }}
        role="table"
        aria-label="Library comparison"
      >
        {/* Header row */}
        <HeaderRow libraries={libraries} />

        {/* City */}
        <SimpleRow
          label="City"
          values={[a.city, b.city]}
          zebra={false}
        />

        {/* Monthly Fee — lower is better */}
        <SimpleRow
          label="Monthly Fee"
          values={[fmtCurrency(a.monthlyFee), fmtCurrency(b.monthlyFee)]}
          highlighted={betterMonthly}
          zebra={true}
        />

        {/* Quarterly Fee */}
        <SimpleRow
          label="Quarterly Fee"
          values={[fmtCurrency(a.quarterlyFee), fmtCurrency(b.quarterlyFee)]}
          highlighted={betterQuarterly}
          zebra={false}
        />

        {/* Annual Fee */}
        <SimpleRow
          label="Annual Fee"
          values={[fmtCurrency(a.annualFee), fmtCurrency(b.annualFee)]}
          highlighted={betterAnnual}
          zebra={true}
        />

        {/* Total Seats */}
        <SimpleRow
          label="Total Seats"
          values={[a.totalSeats, b.totalSeats]}
          zebra={false}
        />

        {/* Available Seats — higher is better */}
        <SimpleRow
          label="Available Seats"
          values={[a.availableSeats, b.availableSeats]}
          highlighted={betterAvailSeats}
          zebra={true}
        />

        {/* Rating — higher is better */}
        <SimpleRow
          label="Rating"
          values={[fmtRating(a.ratingAvg), fmtRating(b.ratingAvg)]}
          highlighted={betterRating}
          zebra={false}
        />

        {/* Review Count — higher is better */}
        <SimpleRow
          label="Reviews"
          values={[a.reviewCount, b.reviewCount]}
          highlighted={betterReviews}
          zebra={true}
        />

        {/* Facilities — checkmarks for each */}
        <FacilitiesRow libraries={libraries} zebra={false} />

        {/* Student Types — badges */}
        <StudentTypesRow libraries={libraries} zebra={true} />

        {/* Contact info */}
        <ContactRow libraries={libraries} zebra={false} />
      </div>
    </div>
  );
}
