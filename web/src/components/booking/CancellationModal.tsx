"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Types -------------------------------------------------------------------

export interface CancellationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  libraryName: string;
  onCancelled: () => void;
}

type RefundTier = "FULL" | "HALF" | "NONE";

interface CancellationPreview {
  refundAmount: number;
  refundPolicy: string;
  refundTier: RefundTier;
}

// --- Helpers -----------------------------------------------------------------

function tierLabel(tier: RefundTier): string {
  switch (tier) {
    case "FULL":
      return "Full refund";
    case "HALF":
      return "50% refund";
    case "NONE":
      return "No refund";
  }
}

function tierColor(tier: RefundTier): string {
  switch (tier) {
    case "FULL":
      return "text-[#16a34a]";
    case "HALF":
      return "text-amber-600";
    case "NONE":
      return "text-red-600";
  }
}

function tierBg(tier: RefundTier): string {
  switch (tier) {
    case "FULL":
      return "bg-[#16a34a]/10 border-[#16a34a]/20";
    case "HALF":
      return "bg-amber-50 border-amber-200";
    case "NONE":
      return "bg-red-50 border-red-200";
  }
}

// --- Main component ----------------------------------------------------------

/**
 * CancellationModal shows a refund preview fetched from
 * GET /api/student/bookings/:id/cancellation-preview and then posts the
 * cancellation to DELETE /api/student/bookings/:id on confirm.
 *
 * Requirements: 2.2, 2.5, 2.6
 */
export function CancellationModal({
  open,
  onOpenChange,
  bookingId,
  libraryName,
  onCancelled,
}: CancellationModalProps) {
  const [preview, setPreview] = useState<CancellationPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cancellation preview whenever the modal opens
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoadingPreview(true);
      setPreview(null);
      setError(null);
      try {
        const res = await fetch(`/api/student/bookings/${bookingId}/cancellation-preview`, {
          credentials: "include",
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "Could not load cancellation details.");
        }
        const data = (await res.json()) as CancellationPreview;
        if (!cancelled) setPreview(data);
      } catch (err: unknown) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load cancellation preview."
          );
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, bookingId]);

  const handleConfirm = async () => {
    setCancelling(true);
    setError(null);

    try {
      const res = await fetch(`/api/student/bookings/${bookingId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Cancellation failed. Please try again.");
      }

      onCancelled();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Cancel Booking"
      description="Review your refund and confirm cancellation"
    >
      <div className="space-y-4">
        {/* Library context */}
        <div className="rounded-2xl bg-sage-100/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-forest-900/50">
            Cancelling booking at
          </p>
          <p className="mt-0.5 font-semibold text-forest-900">{libraryName}</p>
        </div>

        {/* Error display */}
        {error && (
          <div className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        {/* Loading skeleton for preview */}
        {loadingPreview && (
          <div className="space-y-2">
            <div className="h-5 w-1/2 animate-pulse rounded-full bg-sage-100" />
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-sage-100" />
            <div className="h-12 w-full animate-pulse rounded-2xl bg-sage-100" />
          </div>
        )}

        {/* Refund preview */}
        {!loadingPreview && preview && (
          <>
            <div
              className={cn(
                "rounded-2xl border px-4 py-4",
                tierBg(preview.refundTier)
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={cn(
                      "text-sm font-bold",
                      tierColor(preview.refundTier)
                    )}
                  >
                    {tierLabel(preview.refundTier)}
                  </p>
                  <p className="mt-0.5 text-xs text-forest-900/60">
                    {preview.refundPolicy}
                  </p>
                </div>
                <p
                  className={cn(
                    "text-xl font-bold",
                    tierColor(preview.refundTier)
                  )}
                >
                  ₹{preview.refundAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {preview.refundTier === "NONE" && (
              <p className="text-xs text-forest-900/60">
                No refund will be issued as the cancellation is within 3 days of
                the start date or after the booking has already begun.
              </p>
            )}
          </>
        )}

        {/* Warning */}
        {!loadingPreview && preview && (
          <p className="text-xs text-forest-900/60">
            This action cannot be undone. The booking will be permanently
            cancelled.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            disabled={cancelling}
            onClick={() => onOpenChange(false)}
          >
            Keep Booking
          </Button>
          <Button
            className="flex-1 bg-red-600 text-white hover:bg-red-700"
            disabled={loadingPreview || cancelling || !preview}
            onClick={() => void handleConfirm()}
          >
            {cancelling ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Confirm Cancel"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
