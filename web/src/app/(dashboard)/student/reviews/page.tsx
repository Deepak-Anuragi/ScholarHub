"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { cn } from "@/lib/utils";

type Review = {
  _id: string;
  libraryId: { name: string; city: string };
  rating: number;
  comment?: string;
  isVerified: boolean;
  ownerReply?: string;
  createdAt: string;
};

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-none text-forest-900/20"
          )}
        />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No backend yet for student's own reviews — use bookings API to
    // show eligible-to-review expired bookings as placeholder
    fetch("/api/student/bookings", { credentials: "include" })
      .then(() => {
        // TODO: add GET /api/student/reviews endpoint
        setReviews([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6">
          <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
            My Reviews
          </h1>
          <p className="mt-1 text-sm text-forest-900/60">
            Reviews you've written for libraries
          </p>
        </div>
      </AnimatedContent>

      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-card border border-dashed border-line bg-white/60 py-14 text-center">
            <Star className="mx-auto size-8 text-forest-900/20" />
            <p className="mt-3 text-sm font-semibold text-forest-900">
              No reviews yet
            </p>
            <p className="mt-1 text-xs text-forest-900/50">
              Reviews become available after a booking expires.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r._id}
                className="rounded-2xl border border-line bg-white p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-forest-900">
                      {r.libraryId.name}
                    </p>
                    <p className="text-xs text-forest-900/50">{r.libraryId.city}</p>
                  </div>
                  <StarRow rating={r.rating} />
                </div>
                {r.comment && (
                  <p className="mt-2 text-sm text-forest-900/70">{r.comment}</p>
                )}
                {r.ownerReply && (
                  <div className="mt-3 rounded-xl bg-sage-100/60 px-3 py-2 text-xs text-forest-900/70">
                    <span className="font-semibold">Owner replied: </span>
                    {r.ownerReply}
                  </div>
                )}
                {r.isVerified && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#16a34a]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#16a34a]">
                    ✓ Verified
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </AnimatedContent>
    </div>
  );
}
