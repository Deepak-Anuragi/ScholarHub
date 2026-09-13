import LibraryModel from "../models/Library";

/**
 * The places the filter dropdowns offer.
 *
 * These used to be derived from the seed data in lib/mock-data, so the
 * dropdowns advertised states and cities that had nothing behind them in the
 * database — pick one and the listing comes back empty with no explanation.
 * They are read from the libraries themselves instead.
 *
 * The filter matches the public listing's (`{ isActive: true }`), so anything
 * offered here has at least one library the listing will actually return.
 */
const LISTABLE = { isActive: true } as const;

/** Case-insensitive exact match, the way the listing compares these fields. */
function exact(value: string): RegExp {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}

function sorted(values: unknown[]): string[] {
  return (values as string[])
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .sort((a, b) => a.localeCompare(b));
}

export async function getStates(): Promise<string[]> {
  return sorted(await LibraryModel.distinct("state", LISTABLE));
}

export async function getDistricts(state?: string): Promise<string[]> {
  if (!state) return [];
  return sorted(
    await LibraryModel.distinct("district", { ...LISTABLE, state: exact(state) })
  );
}

export async function getCities(state?: string, district?: string): Promise<string[]> {
  if (!state || !district) return [];
  return sorted(
    await LibraryModel.distinct("city", {
      ...LISTABLE,
      state: exact(state),
      district: exact(district),
    })
  );
}
