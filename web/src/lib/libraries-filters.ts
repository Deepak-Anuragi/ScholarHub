import type { LibrarySort } from "./libraries-query";

export const FACILITY_OPTIONS = [
  "WiFi",
  "AC",
  "Locker",
  "Drinking Water",
  "CCTV",
  "Parking",
  "Washroom",
  "Generator",
  "Study Material",
] as const;

export const STUDENT_TYPE_OPTIONS = [
  { label: "Govt Exam", value: "govt-exam" },
  { label: "Entrance Exam", value: "entrance-exam" },
  { label: "School", value: "school" },
  { label: "Professional", value: "professional" },
] as const;

export const RATING_OPTIONS = [
  { label: "Any", value: "" },
  { label: "3+", value: "3" },
  { label: "4+", value: "4" },
  { label: "4.5+", value: "4.5" },
] as const;

export const SORT_OPTIONS: { label: string; value: LibrarySort }[] = [
  { label: "Relevance", value: "relevance" },
  { label: "Rating", value: "rating" },
  { label: "Fee: Low to High", value: "fee-asc" },
  { label: "Fee: High to Low", value: "fee-desc" },
  { label: "Newest", value: "newest" },
  { label: "Seats Available", value: "seats" },
];

export type LibraryFilters = {
  state: string;
  district: string;
  city: string;
  feeMin: number;
  feeMax: number;
  facilities: string[];
  examType: string;
  availableOnly: boolean;
  minRating: string;
  sort: LibrarySort;
  view: "grid" | "list";
  page: number;
};

export const DEFAULT_FILTERS: LibraryFilters = {
  state: "",
  district: "",
  city: "",
  feeMin: 500,
  feeMax: 5000,
  facilities: [],
  examType: "",
  availableOnly: false,
  minRating: "",
  sort: "relevance",
  view: "grid",
  page: 1,
};

export function filtersFromSearchParams(
  params: URLSearchParams
): LibraryFilters {
  return {
    state: params.get("state") ?? "",
    district: params.get("district") ?? "",
    city: params.get("city") ?? "",
    feeMin: Number(params.get("fee_min") ?? DEFAULT_FILTERS.feeMin),
    feeMax: Number(params.get("fee_max") ?? DEFAULT_FILTERS.feeMax),
    facilities: params.get("facilities")?.split(",").filter(Boolean) ?? [],
    examType: params.get("exam_type") ?? "",
    availableOnly: params.get("available_only") === "true",
    minRating: params.get("min_rating") ?? "",
    sort: (params.get("sort") as LibraryFilters["sort"]) || "relevance",
    view: params.get("view") === "list" ? "list" : "grid",
    page: Number(params.get("page") ?? 1),
  };
}

export function filtersToSearchParams(filters: LibraryFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.state) params.set("state", filters.state);
  if (filters.district) params.set("district", filters.district);
  if (filters.city) params.set("city", filters.city);
  if (filters.feeMin !== DEFAULT_FILTERS.feeMin) {
    params.set("fee_min", String(filters.feeMin));
  }
  if (filters.feeMax !== DEFAULT_FILTERS.feeMax) {
    params.set("fee_max", String(filters.feeMax));
  }
  if (filters.facilities.length > 0) {
    params.set("facilities", filters.facilities.join(","));
  }
  if (filters.examType) params.set("exam_type", filters.examType);
  if (filters.availableOnly) params.set("available_only", "true");
  if (filters.minRating) params.set("min_rating", filters.minRating);
  if (filters.sort !== "relevance") params.set("sort", filters.sort);
  if (filters.view !== "grid") params.set("view", filters.view);
  if (filters.page > 1) params.set("page", String(filters.page));

  return params;
}
