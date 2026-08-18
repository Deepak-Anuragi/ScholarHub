import type { LibraryFilters } from "./libraries-filters";

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

export type CoverTone = "sage" | "forest" | "sand";

export type LibraryPhoto = {
  url: string;
  isCover: boolean;
  order?: number;
};

export type LibraryItem = {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  address?: string;
  city: string;
  district: string;
  state: string;
  pincode?: string;
  totalSeats?: number;
  availableSeats: number;
  monthlyFee: number;
  quarterlyFee?: number | null;
  annualFee?: number | null;
  facilities: string[];
  studentTypes?: string[];
  photos?: LibraryPhoto[];
  coverTone?: CoverTone;
  ratingAvg?: number;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  isActive?: boolean;
  whatsapp?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type LibraryQueryParams = {
  city?: string;
  state?: string;
  district?: string;
  fee_min?: number;
  fee_max?: number;
  exam_type?: string;
  facilities?: string[] | string;
  min_rating?: number | string;
  available_only?: boolean | string;
  sort?: LibrarySort;
  page?: number;
  limit?: number;
};

export type LibrariesResult = {
  libraries: LibraryItem[];
  total: number;
  page: number;
  totalPages: number;
};

export function buildLibraryQuery(
  filters: Partial<LibraryFilters> | LibraryQueryParams
): string {
  const query = new URLSearchParams();
  const f = filters as Record<string, unknown>;

  if (typeof f.state === "string" && f.state) query.set("state", f.state);
  if (typeof f.district === "string" && f.district)
    query.set("district", f.district);
  if (typeof f.city === "string" && f.city) query.set("city", f.city);

  const feeMin = (f.feeMin ?? f.fee_min) as number | undefined;
  const feeMax = (f.feeMax ?? f.fee_max) as number | undefined;
  if (feeMin !== undefined && feeMin !== null && feeMin !== 500) {
    query.set("fee_min", String(feeMin));
  }
  if (feeMax !== undefined && feeMax !== null && feeMax !== 5000) {
    query.set("fee_max", String(feeMax));
  }

  const facilities = (f.facilities ?? f.facilities) as
    | string[]
    | string
    | undefined;
  if (Array.isArray(facilities) && facilities.length > 0) {
    query.set("facilities", facilities.join(","));
  } else if (typeof facilities === "string" && facilities) {
    query.set("facilities", facilities);
  }

  const examType = (f.examType ?? f.exam_type) as string | undefined;
  if (examType) {
    query.set("exam_type", examType);
  }

  const availableOnly = (f.availableOnly ?? f.available_only) as
    | boolean
    | string
    | undefined;
  if (availableOnly === true || availableOnly === "true") {
    query.set("available_only", "true");
  }

  const minRating = (f.minRating ?? f.min_rating) as
    | string
    | number
    | undefined;
  if (
    minRating !== undefined &&
    minRating !== null &&
    String(minRating) !== "" &&
    String(minRating) !== "0"
  ) {
    query.set("min_rating", String(minRating));
  }

  const sort = f.sort as LibrarySort | undefined;
  if (sort && sort !== "relevance") {
    query.set("sort", sort);
  }

  const page = f.page as number | undefined;
  if (page && Number(page) > 1) {
    query.set("page", String(page));
  }

  const limit = f.limit as number | undefined;
  if (limit) {
    query.set("limit", String(limit));
  }

  return query.toString();
}
