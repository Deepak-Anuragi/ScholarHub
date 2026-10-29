"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, MapPin, Star, Sparkles, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

type FeaturedLibrary = {
  _id: string;
  name: string;
  city: string;
  monthlyFee: number;
  availableSeats: number;
  ratingAvg: number;
  facilities: string[];
  photos?: { url: string; isCover: boolean }[];
  isFeatured?: boolean;
};

export function FeaturedLibrariesSection() {
  const [libraries, setLibraries] = useState<FeaturedLibrary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ libraries?: FeaturedLibrary[] }>("/libraries/featured")
      .then((res) => {
        setLibraries(res.libraries ?? []);
      })
      .catch(() => {
        setLibraries([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="featured" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#16a34a]/10 px-3 py-1 text-xs font-semibold text-[#16a34a] mb-2">
            <Sparkles className="size-3.5" />
            Curated by Admin
          </div>
          <h2 className="font-display text-3xl text-forest-900 sm:text-4xl dark:text-white">
            Featured Libraries
          </h2>
          <p className="mt-1 text-sm text-forest-900/60 dark:text-zinc-400">
            Top-rated verified study spaces handpicked by platform administrators
          </p>
        </div>
        <Link
          href="/libraries"
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-white/70 px-5 text-sm font-semibold text-forest-900 transition hover:border-[#16a34a] hover:text-[#16a34a] dark:bg-[#27272a] dark:border-[#3f3f46] dark:text-white"
        >
          View all listings →
        </Link>
      </div>

      {loading ? (
        <div className="mt-8 flex h-48 items-center justify-center rounded-card border border-line bg-white/50">
          <Loader2 className="size-6 animate-spin text-[#16a34a]" />
        </div>
      ) : libraries.length === 0 ? (
        <div className="mt-8 rounded-card border border-line bg-white/80 p-12 text-center shadow-soft dark:bg-[#18181b] dark:border-[#27272a]">
          <BookOpen className="mx-auto size-10 text-forest-900/30" />
          <p className="mt-3 text-base font-semibold text-forest-900 dark:text-white">No featured libraries yet</p>
          <p className="mt-1 text-sm text-forest-900/60 dark:text-zinc-400">
            Check back soon or explore all our active library spaces across cities.
          </p>
          <Link
            href="/libraries"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#16a34a] px-6 text-sm font-semibold text-white transition hover:bg-[#15803d]"
          >
            Browse Libraries
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {libraries.map((library) => {
            const coverPhoto = library.photos?.find((p) => p.isCover)?.url ?? library.photos?.[0]?.url;
            const hasSeats = library.availableSeats > 0;

            return (
              <div
                key={library._id}
                className="group flex flex-col justify-between overflow-hidden rounded-card border border-line bg-white/85 p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift dark:bg-[#18181b] dark:border-[#27272a]"
              >
                <div>
                  {/* Image or Icon header */}
                  {coverPhoto ? (
                    <div className="relative mb-4 h-36 w-full overflow-hidden rounded-xl bg-sage-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverPhoto}
                        alt={library.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-amber-500/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
                        <Sparkles className="size-2.5" /> Featured
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {!coverPhoto && (
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#16a34a]/10 text-[#16a34a]">
                          <BookOpen className="size-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-forest-900 group-hover:text-[#16a34a] transition line-clamp-1 dark:text-white">
                          {library.name}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-forest-900/60 dark:text-zinc-400">
                          <MapPin className="size-3" />
                          {library.city}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        hasSeats ? "bg-[#16a34a]/10 text-[#16a34a]" : "bg-red-50 text-red-600"
                      }`}
                    >
                      {hasSeats ? `${library.availableSeats} seats left` : "Full"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      {library.ratingAvg > 0 ? library.ratingAvg.toFixed(1) : "4.8"}
                    </span>
                    <span className="text-sm text-forest-900/70 dark:text-zinc-300">
                      From <strong className="text-forest-900 dark:text-white">₹{library.monthlyFee}</strong>/month
                    </span>
                  </div>

                  {library.facilities && library.facilities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {library.facilities.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-line bg-sage-100/60 px-2.5 py-0.5 text-[11px] font-medium text-forest-900 dark:bg-[#27272a] dark:text-zinc-300 dark:border-[#3f3f46]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  href={`/library/${library._id}`}
                  className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-full bg-[#16a34a] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15803d]"
                >
                  View Details & Reserve
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

