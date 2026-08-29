import { describe, expect, it } from "vitest";

import { PLATFORM_RATE, priceBooking, splitPayout } from "./pricing";

describe("priceBooking", () => {
  it("charges the library fee plus the platform rate on top of it", () => {
    const { libraryFee, platformFee, total } = priceBooking(1500);
    expect(libraryFee).toBe(1500);
    expect(platformFee).toBe(Math.round(1500 * PLATFORM_RATE));
    expect(total).toBe(libraryFee + platformFee);
  });

  it("never returns a total that disagrees with its own parts", () => {
    for (const fee of [0, 1, 7, 99, 1500, 4000, 15000, 123457]) {
      const p = priceBooking(fee);
      expect(p.libraryFee + p.platformFee).toBe(p.total);
    }
  });
});

describe("splitPayout", () => {
  // The defect this covers: the student was charged 2% but 10% was withheld
  // from the owner, so the ledger could not be reconciled against the charge.
  it("splits a booking into shares that add back up to the total", () => {
    for (const fee of [0, 1, 7, 99, 1500, 4000, 15000, 123457]) {
      const { total, libraryFee, platformFee } = priceBooking(fee);
      const split = splitPayout(total, libraryFee);

      expect(split.platformShare + split.ownerShare).toBe(split.totalAmount);
      expect(split.totalAmount).toBe(total);
      expect(split.ownerShare).toBe(libraryFee);
      expect(split.platformShare).toBe(platformFee);
    }
  });

  it("derives the same split for a booking stored before the fee was recorded", () => {
    for (const fee of [1500, 4000, 15000]) {
      const { total, libraryFee } = priceBooking(fee);
      const split = splitPayout(total);

      expect(split.ownerShare).toBe(libraryFee);
      expect(split.platformShare + split.ownerShare).toBe(split.totalAmount);
    }
  });

  it("keeps the invariant even when the stored fee is impossible", () => {
    for (const stored of [-100, 0, 999_999]) {
      const split = splitPayout(1530, stored);
      expect(split.platformShare + split.ownerShare).toBe(1530);
      expect(split.ownerShare).toBeGreaterThanOrEqual(0);
      expect(split.platformShare).toBeGreaterThanOrEqual(0);
    }
  });
});
