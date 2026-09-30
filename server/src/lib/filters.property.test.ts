/**
 * Property-based tests for the library search filter logic.
 *
 * Feature: student-enhancements
 *
 * Each test uses fast-check to generate random library datasets and filter
 * parameters, then asserts that the pure helpers in filters.ts satisfy their
 * correctness properties for ALL generated inputs.
 */

import { describe, it } from "vitest";
import * as fc from "fast-check";

import {
  applyFilters,
  applyFiltersAndPaginate,
  paginateLibraries,
  sortLibraries,
  type LibraryRecord,
  type SortKey,
} from "./filters";

// ── Arbitraries ───────────────────────────────────────────────────────────

const FACILITY_OPTIONS = [
  "WiFi",
  "AC",
  "Locker",
  "Drinking Water",
  "CCTV",
  "Parking",
  "Washroom",
  "Generator",
  "Study Material",
];

const EXAM_LABELS = [
  "Govt Exam",
  "Entrance Exam",
  "School",
  "Professional",
];

/** Generate a single library record with all filterable fields. */
const libraryRecordArb: fc.Arbitrary<LibraryRecord> = fc.record({
  monthlyFee: fc.integer({ min: 100, max: 10_000 }),
  ratingAvg: fc.float({ min: 1.0, max: 5.0, noNaN: true }),
  availableSeats: fc.integer({ min: 0, max: 100 }),
  facilities: fc.uniqueArray(fc.constantFrom(...FACILITY_OPTIONS), {
    minLength: 0,
    maxLength: FACILITY_OPTIONS.length,
  }),
  studentTypes: fc.uniqueArray(fc.constantFrom(...EXAM_LABELS), {
    minLength: 0,
    maxLength: EXAM_LABELS.length,
  }),
});

/** Generate a non-empty array of library records. */
const libraryArrayArb: fc.Arbitrary<LibraryRecord[]> = fc.array(
  libraryRecordArb,
  { minLength: 0, maxLength: 50 }
);

// ── Property 1: Fee filter soundness ─────────────────────────────────────
// Feature: student-enhancements, Property 1: Fee filter soundness
// Validates: Requirement 1.1

describe("Property 1: Fee filter soundness", () => {
  it("every result has monthlyFee within [fee_min, fee_max]", () => {
    fc.assert(
      fc.property(
        libraryArrayArb,
        fc.integer({ min: 100, max: 5_000 }),
        fc.integer({ min: 100, max: 10_000 }),
        (libraries, a, b) => {
          const fee_min = Math.min(a, b);
          const fee_max = Math.max(a, b);

          const results = applyFilters(libraries, { fee_min, fee_max });

          return results.every(
            (lib) => lib.monthlyFee >= fee_min && lib.monthlyFee <= fee_max
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("fee_min only — every result has monthlyFee >= fee_min", () => {
    fc.assert(
      fc.property(
        libraryArrayArb,
        fc.integer({ min: 100, max: 5_000 }),
        (libraries, fee_min) => {
          const results = applyFilters(libraries, { fee_min });
          return results.every((lib) => lib.monthlyFee >= fee_min);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("fee_max only — every result has monthlyFee <= fee_max", () => {
    fc.assert(
      fc.property(
        libraryArrayArb,
        fc.integer({ min: 100, max: 10_000 }),
        (libraries, fee_max) => {
          const results = applyFilters(libraries, { fee_max });
          return results.every((lib) => lib.monthlyFee <= fee_max);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 2: Facilities filter soundness ───────────────────────────────
// Feature: student-enhancements, Property 2: Facilities filter soundness
// Validates: Requirement 1.2

describe("Property 2: Facilities filter soundness", () => {
  it("every result possesses all requested facilities", () => {
    fc.assert(
      fc.property(
        libraryArrayArb,
        fc.uniqueArray(fc.constantFrom(...FACILITY_OPTIONS), {
          minLength: 1,
          maxLength: 3,
        }),
        (libraries, facilities) => {
          const results = applyFilters(libraries, { facilities });

          return results.every((lib) =>
            facilities.every((f) =>
              lib.facilities.some(
                (lf) => lf.toLowerCase() === f.toLowerCase()
              )
            )
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("no facility filter applied — all libraries pass through", () => {
    fc.assert(
      fc.property(libraryArrayArb, (libraries) => {
        const results = applyFilters(libraries, { facilities: [] });
        return results.length === libraries.length;
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 3: Rating filter soundness ──────────────────────────────────
// Feature: student-enhancements, Property 3: Rating filter soundness
// Validates: Requirement 1.3

describe("Property 3: Rating filter soundness", () => {
  it("every result has ratingAvg >= min_rating", () => {
    fc.assert(
      fc.property(
        libraryArrayArb,
        fc.float({ min: 1.0, max: 5.0, noNaN: true }),
        (libraries, min_rating) => {
          const results = applyFilters(libraries, { min_rating });
          return results.every((lib) => lib.ratingAvg >= min_rating);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 4: Sort order invariant ─────────────────────────────────────
// Feature: student-enhancements, Property 4: Sort order invariant
// Validates: Requirements 1.5, 1.6, 1.7, 1.8

describe("Property 4: Sort order invariant", () => {
  const SORT_KEYS: SortKey[] = ["fee-asc", "fee-desc", "rating", "seats"];

  const sortKeyArb = fc.constantFrom<SortKey>(...SORT_KEYS);

  it("sorted list satisfies the comparator for each sort key", () => {
    fc.assert(
      fc.property(libraryArrayArb, sortKeyArb, (libraries, sort) => {
        const sorted = sortLibraries(libraries, sort);

        for (let i = 0; i < sorted.length - 1; i++) {
          const a = sorted[i];
          const b = sorted[i + 1];

          switch (sort) {
            case "fee-asc":
              if (a.monthlyFee > b.monthlyFee) return false;
              break;
            case "fee-desc":
              if (a.monthlyFee < b.monthlyFee) return false;
              break;
            case "rating":
              if (a.ratingAvg < b.ratingAvg) return false;
              break;
            case "seats":
              if (a.availableSeats < b.availableSeats) return false;
              break;
          }
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("sort does not change the total number of results", () => {
    fc.assert(
      fc.property(libraryArrayArb, sortKeyArb, (libraries, sort) => {
        const sorted = sortLibraries(libraries, sort);
        return sorted.length === libraries.length;
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 5: Filter composition ───────────────────────────────────────
// Feature: student-enhancements, Property 5: Filter composition
// Validates: Requirement 1.10

describe("Property 5: Filter composition", () => {
  it("applying all filters at once equals the intersection of applying each independently", () => {
    fc.assert(
      fc.property(
        libraryArrayArb,
        fc.integer({ min: 100, max: 5_000 }),
        fc.integer({ min: 100, max: 10_000 }),
        fc.float({ min: 1.0, max: 5.0, noNaN: true }),
        fc.boolean(),
        (libraries, a, b, min_rating, available_only) => {
          const fee_min = Math.min(a, b);
          const fee_max = Math.max(a, b);

          // Combined filter
          const combined = applyFilters(libraries, {
            fee_min,
            fee_max,
            min_rating,
            available_only,
          });

          // Sequential intersection: apply each filter one by one
          const byFee = applyFilters(libraries, { fee_min, fee_max });
          const byFeeAndRating = applyFilters(byFee, { min_rating });
          const sequential = applyFilters(byFeeAndRating, { available_only });

          // Both approaches must yield the same set (by reference equality of original objects)
          if (combined.length !== sequential.length) return false;

          // Check every item in combined appears in sequential (same object reference)
          return combined.every((lib) => sequential.includes(lib));
        }
      ),
      { numRuns: 100 }
    );
  });

  it("facility filter composed with fee filter equals intersection of each applied independently", () => {
    fc.assert(
      fc.property(
        libraryArrayArb,
        fc.integer({ min: 100, max: 5_000 }),
        fc.integer({ min: 100, max: 10_000 }),
        fc.uniqueArray(fc.constantFrom(...FACILITY_OPTIONS), {
          minLength: 1,
          maxLength: 2,
        }),
        (libraries, a, b, facilities) => {
          const fee_min = Math.min(a, b);
          const fee_max = Math.max(a, b);

          const combined = applyFilters(libraries, {
            fee_min,
            fee_max,
            facilities,
          });

          const byFee = applyFilters(libraries, { fee_min, fee_max });
          const sequential = applyFilters(byFee, { facilities });

          if (combined.length !== sequential.length) return false;
          return combined.every((lib) => sequential.includes(lib));
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 6: Pagination math invariant ────────────────────────────────
// Feature: student-enhancements, Property 6: Pagination math invariant
// Validates: Requirement 1.14

describe("Property 6: Pagination math invariant", () => {
  it("totalPages = Math.ceil(total / limit)", () => {
    fc.assert(
      fc.property(
        libraryArrayArb,
        fc.integer({ min: 1, max: 50 }),  // limit
        fc.integer({ min: 1, max: 20 }),  // page
        (libraries, limit, page) => {
          const result = paginateLibraries(libraries, { page, limit });

          const expectedTotalPages = Math.max(
            1,
            Math.ceil(libraries.length / limit)
          );
          return result.totalPages === expectedTotalPages;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("libraries.length equals Math.min(limit, total - (page-1)*limit)", () => {
    fc.assert(
      fc.property(
        fc.array(libraryRecordArb, { minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 20 }),  // limit
        fc.integer({ min: 1, max: 10 }),  // page (may be clamped)
        (libraries, limit, page) => {
          const result = paginateLibraries(libraries, { page, limit });

          const total = libraries.length;
          const safePage = Math.min(
            Math.max(page, 1),
            Math.max(1, Math.ceil(total / limit))
          );
          const expectedLength = Math.min(
            limit,
            Math.max(0, total - (safePage - 1) * limit)
          );
          return result.libraries.length === expectedLength;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("page and totalPages are always positive integers", () => {
    fc.assert(
      fc.property(
        libraryArrayArb,
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 20 }),
        (libraries, limit, page) => {
          const result = paginateLibraries(libraries, { page, limit });
          return (
            result.page >= 1 &&
            result.totalPages >= 1 &&
            Number.isInteger(result.page) &&
            Number.isInteger(result.totalPages)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("total in result always matches the unsliced library count", () => {
    fc.assert(
      fc.property(
        libraryArrayArb,
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 20 }),
        (libraries, limit, page) => {
          const result = paginateLibraries(libraries, { page, limit });
          return result.total === libraries.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("full pipeline: applyFiltersAndPaginate satisfies pagination invariants", () => {
    fc.assert(
      fc.property(
        libraryArrayArb,
        fc.integer({ min: 100, max: 5_000 }),
        fc.integer({ min: 100, max: 10_000 }),
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 1, max: 10 }),
        (libraries, a, b, limit, page) => {
          const fee_min = Math.min(a, b);
          const fee_max = Math.max(a, b);

          const result = applyFiltersAndPaginate(
            libraries,
            { fee_min, fee_max },
            "relevance",
            { page, limit }
          );

          const expectedTotalPages = Math.max(
            1,
            Math.ceil(result.total / limit)
          );
          return result.totalPages === expectedTotalPages;
        }
      ),
      { numRuns: 100 }
    );
  });
});
