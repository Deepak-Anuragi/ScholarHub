import { libraries, LibrarySummary } from "./mock-data";

export const EXAM_TYPE_MAP: Record<string, string> = {
  "govt-exam": "Govt Exam",
  "entrance-exam": "Entrance Exam",
  school: "School",
  professional: "Professional",
};

export type LibrarySort =
  | "relevance"
  | "rating"
  | "fee-asc"
  | "fee-desc"
  | "newest"
  | "seats";

export type LibraryQueryParams = {
  city?: string;
  state?: string;
  district?: string;
  fee_min?: number;
  fee_max?: number;
  exam_type?: string;
  facilities?: string[];
  min_rating?: number;
  available_only?: boolean;
  sort?: LibrarySort;
  page?: number;
  limit?: number;
};

export type LibrariesResult = {
  libraries: LibrarySummary[];
  total: number;
  page: number;
  totalPages: number;
};

function parseExamType(value?: string): string | undefined {
  if (!value) return undefined;
  return EXAM_TYPE_MAP[value] ?? value;
}

export function queryLibraries(params: LibraryQueryParams): LibrariesResult {
  const {
    city,
    state,
    district,
    fee_min = 500,
    fee_max = 5000,
    exam_type,
    facilities = [],
    min_rating = 0,
    available_only = false,
    sort = "relevance",
    page = 1,
    limit = 12,
  } = params;

  const examLabel = parseExamType(exam_type);

  let results = libraries.filter((library) => {
    if (state && library.state.toLowerCase() !== state.toLowerCase()) {
      return false;
    }
    if (district && library.district.toLowerCase() !== district.toLowerCase()) {
      return false;
    }
    if (city && library.city.toLowerCase() !== city.toLowerCase()) {
      return false;
    }
    const minFee = Math.min(fee_min, fee_max);
    const maxFee = Math.max(fee_min, fee_max);
    if (library.monthlyFee < minFee || library.monthlyFee > maxFee) {
      return false;
    }
    if (examLabel && !library.studentTypes.includes(examLabel)) {
      return false;
    }
    if (facilities.length > 0) {
      const hasAll = facilities.every((facility) =>
        library.facilities.some(
          (item) => item.toLowerCase() === facility.toLowerCase()
        )
      );
      if (!hasAll) return false;
    }
    if (min_rating > 0 && library.rating < min_rating) {
      return false;
    }
    if (available_only && library.availableSeats <= 0) {
      return false;
    }
    return true;
  });

  results = [...results].sort((a, b) => {
    switch (sort) {
      case "rating":
        return b.rating - a.rating;
      case "fee-asc":
        return a.monthlyFee - b.monthlyFee;
      case "fee-desc":
        return b.monthlyFee - a.monthlyFee;
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "seats":
        return b.availableSeats - a.availableSeats;
      case "relevance":
      default:
        return b.rating - a.rating || b.reviewCount - a.reviewCount;
    }
  });

  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * limit;

  return {
    libraries: results.slice(start, start + limit),
    total,
    page: safePage,
    totalPages,
  };
}
