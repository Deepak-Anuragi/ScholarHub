"use client";

import Link from "next/link";
import { Star } from "lucide-react";

import TiltedCard from "@/components/TiltedCard/TiltedCard";
import { Button } from "@/components/ui/button";
import { getFacilityIcon } from "@/lib/facility-icons";
import type { LibrarySummary } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const toneStyles: Record<string, string> = {
  sage: "bg-gradient-to-br from-sage-100 via-sage-200 to-sage-300",
  forest: "bg-gradient-to-br from-forest-700/25 via-sage-200 to-sand-100",
  sand: "bg-gradient-to-br from-sand-100 via-sage-100 to-white",
};

type LibraryCardProps = {
  library: LibrarySummary;
  view?: "grid" | "list";
};

function getSeatBadge(seats: number) {
  if (seats <= 0) {
    return {
      label: "Full",
      className: "bg-red-500/90 text-white",
    };
  }
  if (seats <= 5) {
    return {
      label: `${seats} seats`,
      className: "bg-amber-400/95 text-forest-900",
    };
  }
  return {
    label: `${seats} seats`,
    className: "bg-[#16a34a]/95 text-white",
  };
}

export function LibraryCard({ library, view = "grid" }: LibraryCardProps) {
  const badge = getSeatBadge(library.availableSeats);
  const topFacilities = library.facilities.slice(0, 3);

  const cardBody = (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-card border border-line bg-white/90 shadow-soft transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lift",
        view === "list" && "md:flex-row"
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden",
          view === "list" ? "md:w-72" : "w-full"
        )}
      >
        <div
          className={cn(
            "aspect-video w-full",
            toneStyles[library.coverTone]
          )}
          role="img"
          aria-label={`${library.name} cover`}
        />
        <span
          className={cn(
            "absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm",
            badge.className
          )}
        >
          {badge.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-forest-900 transition group-hover:text-[#16a34a]">
            {library.name}
          </h3>
          <p className="text-sm text-forest-900/70">
            {library.city}, {library.district}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1 font-semibold text-forest-900">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            {library.rating.toFixed(1)}
          </span>
          <span className="text-forest-900/70">
            Starting ₹{library.monthlyFee.toLocaleString("en-IN")}/month
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {topFacilities.map((facility) => {
            const Icon = getFacilityIcon(facility);
            return (
              <span
                key={facility}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-forest-900/80"
              >
                <Icon className="size-3.5 text-[#16a34a]" aria-hidden />
                {facility}
              </span>
            );
          })}
        </div>

        <div className="mt-auto pt-5">
          <Button
            asChild
            className="w-full bg-[#16a34a] text-white hover:bg-[#15803d]"
          >
            <Link href={`/library/${library.id}`}>View Details</Link>
          </Button>
        </div>
      </div>
    </article>
  );

  if (view === "list") {
    return cardBody;
  }

  return (
    <TiltedCard
      tiltMaxAngle={8}
      scale={1.02}
      disableOnMobile
      className="h-full"
    >
      {cardBody}
    </TiltedCard>
  );
}
