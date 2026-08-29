/**
 * Client-side mirror of server/src/lib/pricing.ts.
 *
 * Used only to show the fee breakdown before an order exists. The server is
 * authoritative: the amount actually charged is create-order's `amount`, and
 * the payout ledger is derived from the same rate there. Keep PLATFORM_RATE in
 * sync with the server (and with PLATFORM_RATE in server/.env if it is set).
 */

/** Platform commission, charged to the student on top of the library's fee. */
export const PLATFORM_RATE = 0.02;

/** e.g. 0.02 -> "2%" — for fee labels. */
export const PLATFORM_RATE_LABEL = `${Number((PLATFORM_RATE * 100).toFixed(2))}%`;

export interface BookingAmounts {
  libraryFee: number;
  platformFee: number;
  total: number;
}

export function priceBooking(libraryFee: number): BookingAmounts {
  const fee = Math.max(0, Math.round(libraryFee));
  const platformFee = Math.round(fee * PLATFORM_RATE);
  return { libraryFee: fee, platformFee, total: fee + platformFee };
}
