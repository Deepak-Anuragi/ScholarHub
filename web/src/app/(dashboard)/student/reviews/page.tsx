"use client";

import { useEffect, useState } from "react";
import { Star, MessageSquarePlus } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { api } from "@/lib/api";
import { Edit2 } from "lucide-react";

type Review = {
  _id: string;
  libraryId: { name: string; city: string };
  bookingId: { plan: string; startDate: string; endDate: string } | null;
  rating: number;
  comment?: string;
  isVerified: boolean;
  ownerReply?: string;
  createdAt: string;
};

type EligibleBooking = {
  _id: string;
  libraryId: { name: string; city: string };
  plan: string;
  endDate: string;
};

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <span className="inline-flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              "size-6 transition-colors",
              i <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-forest-900/20"
            )}
          />
        </button>
      ))}
    </span>
  );
}

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

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function canEdit(createdAt: string) {
  const diffHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  return diffHours <= 24;
}

export default function ReviewsPage() {
  const [reviews, setReviews]               = useState<Review[]>([]);
  const [eligible, setEligible]             = useState<EligibleBooking[]>([]);
  const [loading, setLoading]               = useState(true);
  const [composing, setComposing]           = useState<EligibleBooking | null>(null);
  const [editingReview, setEditingReview]   = useState<Review | null>(null);
  const [rating, setRating]                 = useState(0);
  const [comment, setComment]               = useState("");
  const [submitting, setSubmitting]         = useState(false);
  const [submitError, setSubmitError]       = useState("");

  const load = () => {
    setLoading(true);
    api
      .get<{ reviews?: Review[]; eligibleBookings?: EligibleBooking[] }>("/student/reviews")
      .then((d) => {
        setReviews(d.reviews ?? []);
        setEligible(d.eligibleBookings ?? []);
      })
      .catch(() => {
        setReviews([]);
        setEligible([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      if (editingReview) {
        const res = await api.patch<{ review: Review }>(`/student/reviews/${editingReview._id}`, { rating, comment });
        if (res.review) {
          setReviews((prev) => prev.map((r) => (r._id === res.review._id ? res.review : r)));
        }
        setEditingReview(null);
      } else if (composing) {
        const res = await api.post<{ review: Review }>("/student/reviews", { bookingId: composing._id, rating, comment });
        if (res.review) setReviews((prev) => [res.review, ...prev]);
        setEligible((prev) => prev.filter((b) => b._id !== composing._id));
        setComposing(null);
      }
      setRating(0);
      setComment("");
    } catch (err) {
      setSubmitError((err as Error)?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6">
          <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
            My Reviews
          </h1>
          <p className="mt-1 text-sm text-forest-900/60">
            Reviews you&apos;ve written for libraries
          </p>
        </div>
      </AnimatedContent>

      {/* Eligible to review */}
      {!loading && eligible.length > 0 && (
        <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.03}>
          <div className="mb-6 rounded-card border border-line bg-white p-4 shadow-soft">
            <p className="mb-3 text-sm font-semibold text-forest-900">
              Bookings you can review
            </p>
            <div className="space-y-2">
              {eligible.map((b) => (
                <div
                  key={b._id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-forest-900">
                      {b.libraryId.name}
                    </p>
                    <p className="text-xs text-forest-900/50">
                      {b.libraryId.city} · {b.plan.toLowerCase()} ·
                      ended {fmt(b.endDate)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setComposing(b);
                      setRating(0);
                      setComment("");
                      setSubmitError("");
                    }}
                    className="shrink-0 bg-[#16a34a] text-white hover:bg-[#15803d]"
                  >
                    <MessageSquarePlus className="size-3.5" />
                    Write
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </AnimatedContent>
      )}

      {/* Write-review modal/inline form */}
      {composing && (
        <AnimatedContent distance={16} duration={0.3} threshold={0}>
          <div className="mb-6 rounded-card border border-[#16a34a]/30 bg-[#16a34a]/5 p-5">
            <p className="mb-1 text-sm font-semibold text-forest-900">
              Review for{" "}
              <span className="text-[#16a34a]">{composing.libraryId.name}</span>
            </p>
            <p className="mb-4 text-xs text-forest-900/50">
              {composing.libraryId.city} · ended {fmt(composing.endDate)}
            </p>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-forest-900/50">
                  Your rating
                </p>
                <StarPicker value={rating} onChange={setRating} />
                {rating === 0 && (
                  <p className="mt-1 text-xs text-red-400">Please select a rating</p>
                )}
              </div>

              <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
                Comment (optional)
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Share your experience with this library…"
                  className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-forest-900 outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20 resize-none"
                />
                <span className="text-right text-xs text-forest-900/30">
                  {comment.length}/500
                </span>
              </label>

              {submitError && (
                <p className="text-xs text-red-500">{submitError}</p>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={submitting || rating === 0}
                  className="bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-60"
                  size="sm"
                >
                  {submitting ? "Submitting…" : "Submit Review"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setComposing(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </AnimatedContent>
      )}

      {/* Reviews list */}
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
          <div className="space-y-3">
            {reviews.map((r) => (
              <div
                key={r._id}
                className="rounded-2xl border border-line bg-white p-4 shadow-soft"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-forest-900">
                      {r.libraryId.name}
                    </p>
                    <p className="text-xs text-forest-900/50">
                      {r.libraryId.city}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StarRow rating={r.rating} />
                    {r.isVerified && (
                      <span className="rounded-full bg-[#16a34a]/10 px-2 py-0.5 text-[10px] font-semibold text-[#16a34a]">
                        Verified
                      </span>
                    )}
                  </div>
                </div>

                {r.comment && (
                  <p className="mt-2 text-sm text-forest-900/70">{r.comment}</p>
                )}

                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-forest-900/30">{fmt(r.createdAt)}</p>
                  {canEdit(r.createdAt) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingReview(r);
                        setComposing(null);
                        setRating(r.rating);
                        setComment(r.comment || "");
                        setSubmitError("");
                      }}
                      className="h-7 px-2 text-xs text-[#16a34a] hover:bg-[#16a34a]/10"
                    >
                      <Edit2 className="mr-1 size-3" />
                      Edit (within 24h)
                    </Button>
                  )}
                </div>

                {r.ownerReply && (
                  <div className="mt-3 rounded-xl bg-sage-100/60 px-3 py-2 text-sm">
                    <p className="text-xs font-semibold text-forest-900/60">
                      Owner replied
                    </p>
                    <p className="mt-0.5 text-forest-900/80">{r.ownerReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </AnimatedContent>
    </div>
  );
}
