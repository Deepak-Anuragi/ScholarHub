// Feature: student-enhancements — Refund Calculator
// Requirements: 2.2, 12.1, 12.3

export type RefundTier = "FULL" | "HALF" | "NONE";

export interface RefundResult {
  refundAmount: number;   // non-negative integer rupees
  refundTier: RefundTier;
  refundPolicy: string;
}

/**
 * Pure refund calculator — no side effects, no I/O.
 *
 * Refund policy:
 *   daysUntilStart > 7  → FULL refund (100% of amountPaid)
 *   3 <= daysUntilStart <= 7 → HALF refund (50%, rounded)
 *   daysUntilStart < 3 OR after startDate → NONE (0)
 *
 * @param amountPaid  Amount originally paid (rupees). Treated as non-negative.
 * @param startDate   Booking start date.
 * @param now         Current timestamp (defaults to new Date(); injectable for testing).
 * @returns           RefundResult with a non-negative integer refundAmount.
 */
export function computeRefund(
  amountPaid: number,
  startDate: Date,
  now: Date = new Date()
): RefundResult {
  const paid = Math.max(0, Math.round(amountPaid));
  const daysUntilStart = Math.ceil(
    (startDate.getTime() - now.getTime()) / 86_400_000
  );

  if (daysUntilStart > 7) {
    return {
      refundAmount: paid,
      refundTier: "FULL",
      refundPolicy: "Full refund (>7 days before start)",
    };
  }

  if (daysUntilStart >= 3) {
    return {
      refundAmount: Math.max(0, Math.round(paid * 0.5)),
      refundTier: "HALF",
      refundPolicy: "50% refund (3–7 days before start)",
    };
  }

  return {
    refundAmount: 0,
    refundTier: "NONE",
    refundPolicy: "No refund (<3 days before start or after start)",
  };
}
