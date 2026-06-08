"use client";

import { LayoutGrid, LayoutList, SearchX } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatedGrid } from "@/components/AnimatedList/AnimatedList";
import { LibraryCard } from "@/components/library/LibraryCard";
import { LibraryResultsSkeleton } from "@/components/library/LibraryCardSkeleton";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  DEFAULT_FILTERS,
  FACILITY_OPTIONS,
  filtersFromSearchParams,
  filtersToSearchParams,
  RATING_OPTIONS,
  SORT_OPTIONS,
  STUDENT_TYPE_OPTIONS,
  type LibraryFilters,
} from "@/lib/libraries-filters";
import type { LibrariesResult } from "@/lib/libraries-query";
import { cn } from "@/lib/utils";

async function fetchLocations(state?: string, district?: string) {
  const params = new URLSearchParams();
  if (state) params.set("state", state);
  if (district) params.set("district", district);
  const response = await fetch(`/api/locations?${params.toString()}`);
  return response.json() as Promise<{
    states?: string[];
    districts?: string[];
    cities?: string[];
  }>;
}

async function fetchLibrariesFromApi(query: string) {
  const response = await fetch(`/api/libraries?${query}`);
  if (!response.ok) {
    throw new Error("Failed to fetch libraries");
  }
  return response.json() as Promise<LibrariesResult>;
}

export function LibrariesExplorer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlFilters = useMemo(
    () => filtersFromSearchParams(searchParams),
    [searchParams]
  );

  const [draft, setDraft] = useState<LibraryFilters>(urlFilters);
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [result, setResult] = useState<LibrariesResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterSnapshot = useMemo(
    () => ({
      state: draft.state,
      district: draft.district,
      city: draft.city,
      feeMin: draft.feeMin,
      feeMax: draft.feeMax,
      facilities: draft.facilities,
      examType: draft.examType,
      availableOnly: draft.availableOnly,
      minRating: draft.minRating,
    }),
    [
      draft.state,
      draft.district,
      draft.city,
      draft.feeMin,
      draft.feeMax,
      draft.facilities,
      draft.examType,
      draft.availableOnly,
      draft.minRating,
    ]
  );
  const debouncedFilters = useDebouncedValue(filterSnapshot, 300);
  const skipDebounceSync = useRef(true);

  const updateUrl = useCallback(
    (next: LibraryFilters, replace = false) => {
      const params = filtersToSearchParams(next);
      const query = params.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      if (replace) {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    },
    [pathname, router]
  );

  useEffect(() => {
    setDraft(urlFilters);
  }, [urlFilters]);

  useEffect(() => {
    if (skipDebounceSync.current) {
      skipDebounceSync.current = false;
      return;
    }

    const nextFilters: LibraryFilters = {
      ...urlFilters,
      ...debouncedFilters,
      page: 1,
    };
    const params = filtersToSearchParams(nextFilters);
    const current = filtersToSearchParams(urlFilters).toString();
    const next = params.toString();
    if (next !== current) {
      updateUrl(nextFilters, true);
    }
  }, [debouncedFilters, urlFilters, updateUrl]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = filtersToSearchParams(urlFilters);
        params.set("limit", "12");
        const data = await fetchLibrariesFromApi(params.toString());
        if (!cancelled) setResult(data);
      } catch {
        if (!cancelled) setError("Could not load libraries. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [urlFilters]);

  useEffect(() => {
    void fetchLocations().then((data) => setStates(data.states ?? []));
  }, []);

  useEffect(() => {
    if (!draft.state) {
      setDistricts([]);
      return;
    }
    void fetchLocations(draft.state).then((data) =>
      setDistricts(data.districts ?? [])
    );
  }, [draft.state]);

  useEffect(() => {
    if (!draft.state || !draft.district) {
      setCities([]);
      return;
    }
    void fetchLocations(draft.state, draft.district).then((data) =>
      setCities(data.cities ?? [])
    );
  }, [draft.state, draft.district]);

  const setDraftField = <K extends keyof LibraryFilters>(
    key: K,
    value: LibraryFilters[K]
  ) => {
    setDraft((current) => {
      const next = { ...current, [key]: value, page: 1 };
      if (key === "state") {
        next.district = "";
        next.city = "";
      }
      if (key === "district") {
        next.city = "";
      }
      return next;
    });
  };

  const toggleFacility = (facility: string) => {
    setDraft((current) => {
      const exists = current.facilities.includes(facility);
      return {
        ...current,
        page: 1,
        facilities: exists
          ? current.facilities.filter((item) => item !== facility)
          : [...current.facilities, facility],
      };
    });
  };

  const applyFilters = () => updateUrl(draft);

  const resetFilters = () => {
    setDraft(DEFAULT_FILTERS);
    updateUrl(DEFAULT_FILTERS);
  };

  const cityLabel = urlFilters.city || "India";

  return (
    <div className="min-h-screen bg-sand-100 text-ink">
      <div className="relative -mt-[var(--header-height)] overflow-hidden pt-[var(--header-height)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-24 h-48 w-48 rounded-full bg-sage-200/60 blur-3xl" />
          <div className="absolute right-[-60px] top-24 h-56 w-56 rounded-full bg-sage-100/70 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-8 pt-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-forest-900/70">
            Library listings
          </p>
          <h1 className="mt-2 font-display text-3xl text-forest-900 sm:text-4xl">
            Compare verified libraries by city, fees, and seats.
          </h1>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-card border border-line bg-white/90 p-5 shadow-soft lg:sticky lg:top-[calc(var(--header-height)+1rem)]">
            <form
              className="grid gap-5"
              onSubmit={(event) => {
                event.preventDefault();
                applyFilters();
              }}
            >
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-forest-900">
                  State
                </label>
                <select
                  value={draft.state}
                  onChange={(event) =>
                    setDraftField("state", event.target.value)
                  }
                  className="h-11 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none focus:border-[#16a34a]"
                >
                  <option value="">All states</option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-forest-900">
                  District
                </label>
                <select
                  value={draft.district}
                  disabled={!draft.state}
                  onChange={(event) =>
                    setDraftField("district", event.target.value)
                  }
                  className="h-11 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none focus:border-[#16a34a] disabled:opacity-50"
                >
                  <option value="">All districts</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-forest-900">
                  City
                </label>
                <select
                  value={draft.city}
                  disabled={!draft.district}
                  onChange={(event) =>
                    setDraftField("city", event.target.value)
                  }
                  className="h-11 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none focus:border-[#16a34a] disabled:opacity-50"
                >
                  <option value="">All cities</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between text-sm font-semibold text-forest-900">
                  <span>Fee range</span>
                  <span className="font-normal text-forest-900/70">
                    ₹{draft.feeMin} – ₹{draft.feeMax}/month
                  </span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={5000}
                  step={50}
                  value={draft.feeMin}
                  onChange={(event) =>
                    setDraftField("feeMin", Number(event.target.value))
                  }
                  className="accent-[#16a34a]"
                />
                <input
                  type="range"
                  min={500}
                  max={5000}
                  step={50}
                  value={draft.feeMax}
                  onChange={(event) =>
                    setDraftField("feeMax", Number(event.target.value))
                  }
                  className="accent-[#16a34a]"
                />
              </div>

              <div className="grid gap-2">
                <p className="text-sm font-semibold text-forest-900">
                  Facilities
                </p>
                <div className="grid max-h-44 gap-2 overflow-y-auto pr-1">
                  {FACILITY_OPTIONS.map((facility) => (
                    <label
                      key={facility}
                      className="flex items-center gap-2 text-sm text-forest-900/80"
                    >
                      <input
                        type="checkbox"
                        checked={draft.facilities.includes(facility)}
                        onChange={() => toggleFacility(facility)}
                        className="h-4 w-4 rounded border-line accent-[#16a34a]"
                      />
                      {facility}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <p className="text-sm font-semibold text-forest-900">
                  Student type
                </p>
                <div className="grid gap-2">
                  {STUDENT_TYPE_OPTIONS.map((type) => (
                    <label
                      key={type.value}
                      className="flex items-center gap-2 text-sm text-forest-900/80"
                    >
                      <input
                        type="radio"
                        name="exam_type"
                        checked={draft.examType === type.value}
                        onChange={() => setDraftField("examType", type.value)}
                        className="h-4 w-4 border-line accent-[#16a34a]"
                      />
                      {type.label}
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => setDraftField("examType", "")}
                    className="text-left text-xs font-medium text-[#16a34a] hover:underline"
                  >
                    Clear student type
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold text-forest-900">
                <input
                  type="checkbox"
                  checked={draft.availableOnly}
                  onChange={(event) =>
                    setDraftField("availableOnly", event.target.checked)
                  }
                  className="h-4 w-4 rounded border-line accent-[#16a34a]"
                />
                Show only available libraries
              </label>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-forest-900">
                  Rating
                </label>
                <select
                  value={draft.minRating}
                  onChange={(event) =>
                    setDraftField("minRating", event.target.value)
                  }
                  className="h-11 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none focus:border-[#16a34a]"
                >
                  {RATING_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="submit"
                className="h-11 bg-[#16a34a] text-white hover:bg-[#15803d]"
              >
                Apply Filters
              </Button>
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-semibold text-[#16a34a] hover:underline"
              >
                Reset
              </button>
            </form>
          </aside>

          <section>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-forest-900/70">
                {loading
                  ? "Searching libraries..."
                  : `${result?.total ?? 0} libraries found in ${cityLabel}`}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-forest-900">
                  Sort by
                  <select
                    value={urlFilters.sort}
                    onChange={(event) => {
                      const next = {
                        ...draft,
                        sort: event.target.value as LibraryFilters["sort"],
                        page: 1,
                      };
                      setDraft(next);
                      updateUrl(next, true);
                    }}
                    className="h-10 rounded-xl border border-line bg-white px-3 text-sm text-forest-900 outline-none focus:border-[#16a34a]"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="inline-flex rounded-xl border border-line bg-white p-1">
                  <button
                    type="button"
                    aria-label="Grid view"
                    onClick={() => {
                      const next = { ...draft, view: "grid" as const };
                      setDraft(next);
                      updateUrl(next, true);
                    }}
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-lg transition",
                      urlFilters.view === "grid"
                        ? "bg-[#16a34a] text-white"
                        : "text-forest-900/70 hover:bg-sage-100"
                    )}
                  >
                    <LayoutGrid className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="List view"
                    onClick={() => {
                      const next = { ...draft, view: "list" as const };
                      setDraft(next);
                      updateUrl(next, true);
                    }}
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-lg transition",
                      urlFilters.view === "list"
                        ? "bg-[#16a34a] text-white"
                        : "text-forest-900/70 hover:bg-sage-100"
                    )}
                  >
                    <LayoutList className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              {loading ? (
                <LibraryResultsSkeleton count={12} />
              ) : error ? (
                <div className="rounded-card border border-line bg-white/80 p-8 text-center text-sm text-red-600">
                  {error}
                </div>
              ) : result && result.libraries.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-white/70 px-6 py-16 text-center">
                  <div className="flex size-16 items-center justify-center rounded-full bg-sage-100 text-[#16a34a]">
                    <SearchX className="size-8" />
                  </div>
                  <h2 className="mt-4 font-display text-2xl text-forest-900">
                    No libraries found
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-forest-900/70">
                    No libraries found. Try adjusting your filters.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-6"
                    onClick={resetFilters}
                  >
                    Reset filters
                  </Button>
                </div>
              ) : (
                <div
                  className={cn(
                    urlFilters.view === "grid"
                      ? "grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
                      : "flex flex-col gap-4"
                  )}
                >
                  <AnimatedGrid
                    key={`${urlFilters.page}-${searchParams.toString()}`}
                    staggerDelay={0.07}
                  >
                    {result?.libraries.map((library) => (
                      <LibraryCard
                        key={library.id}
                        library={library}
                        view={urlFilters.view}
                      />
                    ))}
                  </AnimatedGrid>
                </div>
              )}
            </div>

            {!loading && result && result.totalPages > 1 ? (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={result.page <= 1}
                  onClick={() => {
                    const next = {
                      ...draft,
                      page: Math.max(1, result.page - 1),
                    };
                    setDraft(next);
                    updateUrl(next, true);
                  }}
                >
                  Previous
                </Button>
                <span className="px-3 text-sm text-forest-900/70">
                  Page {result.page} of {result.totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={result.page >= result.totalPages}
                  onClick={() => {
                    const next = {
                      ...draft,
                      page: Math.min(result.totalPages, result.page + 1),
                    };
                    setDraft(next);
                    updateUrl(next, true);
                  }}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
