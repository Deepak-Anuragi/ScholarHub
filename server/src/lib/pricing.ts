/**
 * Single source of truth for booking money.
 *
 * The model is deliberately simple so the ledger reconciles against what the
 * student was actually charged:
 *
 *   student pays  = libraryFee + platformFee
 *   platformFee   = round(libraryFee * PLATFORM_RATE)
 *   owner keeps   = libraryFee   (in full)
 *   platform keeps= platformFee
 *
 * Every amount is in whole rupees.
 */

const DEFAULT_PLATFORM_RATE = 0.02;

function resolveRate(): number {
  const raw = process.env.PLATFORM_RATE;
  if (raw === undefined || raw.trim() === "") return DEFAULT_PLATFORM_RATE;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed >= 1) {
    console.warn(`[pricing] Ignoring invalid PLATFORM_RATE="${raw}"; using ${DEFAULT_PLATFORM_RATE}.`);
    return DEFAULT_PLATFORM_RATE;
  }
  return parsed;
}

/** Platform commission, charged to the student on top of the library's fee. */
export const PLATFORM_RATE = resolveRate();

/** e.g. 0.02 -> "2%" — for fee labels and receipts. */
export const PLATFORM_RATE_LABEL = `${Number((PLATFORM_RATE * 100).toFixed(2))}%`;

export interface BookingAmounts {
  /** The library's own fee for the plan. Paid out to the owner in full. */
  libraryFee: number;
  /** What the platform charges the student on top of it. */
  platformFee: number;
  /** What the student is charged. */
  total: number;
}

export function priceBooking(libraryFee: number): BookingAmounts {
  const fee = Math.max(0, Math.round(libraryFee));
  const platformFee = Math.round(fee * PLATFORM_RATE);
  return { libraryFee: fee, platformFee, total: fee + platformFee };
}

export interface PayoutSplit {
  totalAmount: number;
  commissionRate: number;
  platformShare: number;
  ownerShare: number;
}

/**
 * Split a settled booking into payout shares.
 *
 * `libraryFee` is the fee stored on the booking at create-order. Bookings
 * written before that field existed fall back to deriving it from the total,
 * which is exact for any amount this pricing produced.
 *
 * Invariant: platformShare + ownerShare === totalAmount, always.
 */
export function splitPayout(totalAmount: number, libraryFee?: number): PayoutSplit {
  const total = Math.max(0, Math.round(totalAmount));
  const derived = libraryFee ?? Math.round(total / (1 + PLATFORM_RATE));
  const ownerShare = Math.min(Math.max(Math.round(derived), 0), total);
  return {
    totalAmount: total,
    commissionRate: PLATFORM_RATE,
    platformShare: total - ownerShare,
    ownerShare,
  };
}
