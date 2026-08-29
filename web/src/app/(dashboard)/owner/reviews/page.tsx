"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, MessageSquare, Star } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { DataError } from "@/components/dashboard/DataError";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Review = {
  _id: string;
  studentId: { name: string; avatarUrl?: string };
  rating: number;
  comment?: string;
  isVerified: boolean;
  ownerReply?: string;
  createdAt: string;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i <= rating ? "fill-amber-400 text-amber-400" : "text-forest-900/20"
          )}
        />
      ))}
    </span>
  );
}

export default function OwnerReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get<{ reviews?: Review[] }>("/owner/reviews")
      .then((d) => setReviews(d.reviews ?? []))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Something went wrong.")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const d = await api.patch<{ review?: Review }>("/owner/reviews", {
        reviewId,
        ownerReply: replyText,
      });
      if (d.review) {
        setReviews((prev) =>
          prev.map((r) => (r._id === reviewId ? { ...r, ownerReply: replyText } : r))
        );
      }
      setReplyingId(null);
      setReplyText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post the reply.");
    } finally {
      setSaving(false);
    }
  };

  const pending = reviews.filter((r) => !r.ownerReply).length;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
              Student Reviews
            </h1>
            <p className="mt-1 text-sm text-forest-900/60">
              {pending > 0 ? (
                <span className="font-semibold text-amber-600">{pending} awaiting reply · </span>
              ) : null}
              {reviews.length} total reviews
            </p>
          </div>
        </div>
      </AnimatedContent>

      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
        {error ? (
          <DataError message={error} onRetry={load} />
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-card border border-dashed border-line bg-white/60 py-14 text-center">
            <Star className="mx-auto size-8 text-forest-900/20" />
            <p className="mt-3 text-sm text-forest-900/50">No reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => {
              const initials = (r.studentId?.name ?? "S")
                .split(" ")
                .slice(0, 2)
                .map((p) => p[0])
                .join("")
                .toUpperCase();
              return (
                <div
                  key={r._id}
                  className={cn(
                    "rounded-2xl border bg-white p-4",
                    !r.ownerReply ? "border-amber-200" : "border-line"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest-700/10 text-sm font-bold text-forest-700">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-forest-900">
                          {r.studentId?.name ?? "Student"}
                        </p>
                        <Stars rating={r.rating} />
                      </div>
                      <p className="text-xs text-forest-900/40">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                      {r.comment && (
                        <p className="mt-2 text-sm text-forest-900/70">{r.comment}</p>
                      )}
                      {r.isVerified && (
                        <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#16a34a]">
                          <Check className="size-3" aria-hidden />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Owner reply */}
                  {r.ownerReply ? (
                    <div className="mt-3 rounded-xl bg-sage-100/60 px-3 py-2 text-sm text-forest-900/70">
                      <span className="font-semibold">Your reply: </span>
                      {r.ownerReply}
                    </div>
                  ) : replyingId === r._id ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply…"
                        rows={2}
                        className="w-full rounded-xl border border-line bg-sage-100/40 px-3 py-2 text-sm text-forest-900 outline-none transition focus:border-forest-700 resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => void handleReply(r._id)}
                          disabled={saving || !replyText.trim()}
                          className="bg-forest-700 text-white hover:bg-forest-900"
                        >
                          {saving ? <Loader2 className="size-3.5 animate-spin" /> : "Post Reply"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setReplyingId(null); setReplyText(""); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setReplyingId(r._id); setReplyText(""); }}
                      className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-forest-700 transition hover:text-forest-900"
                    >
                      <MessageSquare className="size-3.5" />
                      Reply to this review
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AnimatedContent>
    </div>
  );
}
