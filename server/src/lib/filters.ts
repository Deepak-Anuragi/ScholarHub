import type { LibrarySort } from "./libraries-query";

export type SortKey = Exclude<LibrarySort, "newest" | "relevance">;

export type LibraryRecord = {
  monthlyFee: number;
  ratingAvg: number;
  availableSeats: number;
  facilities: string[];
  studentTypes: string[];
};

export type PaginationOpts = { page: number; limit: number };

export type FilterOpts = {
  fee_min?: number;
  fee_max?: number;
  facilities?: string[];
  min_rating?: number;
  exam_type?: string;
  available_only?: boolean;
};

export type PaginatedLibraries<T extends LibraryRecord> = {
  libraries: T[];
  total: number;
  page: number;
  totalPages: number;
};

function facilityMatchesOne(
  libraryFacilities: string[],
  requestedFacility: string
): boolean {
  const req = requestedFacility.toLowerCase();
  return libraryFacilities.some((lf) => lf.toLowerCase() === req);
}

function libraryHasAllFacilities(
  libraryFacilities: string[],
  requested: string[]
): boolean {
  return requested.every((f) => facilityMatchesOne(libraryFacilities, f));
}

export function applyFilters<T extends LibraryRecord>(
  libraries: T[],
  opts: FilterOpts
): T[] {
  const {
    fee_min,
    fee_max,
    facilities = [],
    min_rating,
    exam_type,
    available_only,
  } = opts;

  return libraries.filter((lib) => {
    if (fee_min !== undefined && lib.monthlyFee < fee_min) return false;
    if (fee_max !== undefined && lib.monthlyFee > fee_max) return false;
    if (facilities.length > 0 && !libraryHasAllFacilities(lib.facilities, facilities))
      return false;
    if (min_rating !== undefined && lib.ratingAvg < min_rating) return false;
    if (exam_type !== undefined && exam_type !== "") {
      if (!lib.studentTypes.some((s) => s === exam_type)) return false;
    }
    if (available_only === true && lib.availableSeats <= 0) return false;
    return true;
  });
}

export function sortLibraries<T extends LibraryRecord>(
  libraries: T[],
  sort: LibrarySort | "relevance"
): T[] {
  const copy = libraries.slice();

  switch (sort) {
    case "fee-asc":
      return copy.sort((a, b) => a.monthlyFee - b.monthlyFee);
    case "fee-desc":
      return copy.sort((a, b) => b.monthlyFee - a.monthlyFee);
    case "rating":
      return copy.sort((a, b) => b.ratingAvg - a.ratingAvg);
    case "seats":
      return copy.sort((a, b) => b.availableSeats - a.availableSeats);
    case "newest":
      return copy;
    case "relevance":
    default:
      return copy.sort((a, b) => {
        if (b.ratingAvg !== a.ratingAvg) return b.ratingAvg - a.ratingAvg;
        return b.availableSeats - a.availableSeats;
      });
  }
}

export function paginateLibraries<T extends LibraryRecord>(
  libraries: T[],
  opts: PaginationOpts
): PaginatedLibraries<T> {
  const total = libraries.length;
  const limit = Math.max(1, Math.floor(opts.limit) || 1);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(Math.max(1, Math.floor(opts.page) || 1), totalPages);

  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    libraries: libraries.slice(start, end),
    total,
    page,
    totalPages,
  };
}

export function applyFiltersAndPaginate<T extends LibraryRecord>(
  libraries: T[],
  filterOpts: FilterOpts,
  sort: LibrarySort | "relevance",
  paginationOpts: PaginationOpts
): PaginatedLibraries<T> {
  const filtered = applyFilters(libraries, filterOpts);
  const sorted = sortLibraries(filtered, sort);
  return paginateLibraries(sorted, paginationOpts);
}
