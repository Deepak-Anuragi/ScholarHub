import { api } from "./api";

export type LocationTree = Record<string, Record<string, string[]>>;

// ── Async API helpers calling Express backend ──────────────────────────────
export async function fetchLocations(
  state?: string,
  district?: string
): Promise<{ states?: string[]; districts?: string[]; cities?: string[] }> {
  const params = new URLSearchParams();
  if (state) params.set("state", state);
  if (district) params.set("district", district);
  const query = params.toString();
  try {
    return await api.get<{
      states?: string[];
      districts?: string[];
      cities?: string[];
    }>(`/locations${query ? `?${query}` : ""}`);
  } catch (err) {
    // Filter dropdowns are secondary to the listing itself, which reports its
    // own failure. Return nothing rather than inventing places that do not
    // exist in the database.
    console.warn("[fetchLocations] could not load locations:", err);
    return {};
  }
}

export async function fetchStates(): Promise<string[]> {
  const data = await fetchLocations();
  return data.states ?? [];
}

export async function fetchDistricts(state: string): Promise<string[]> {
  const data = await fetchLocations(state);
  return data.districts ?? [];
}

export async function fetchCities(
  state: string,
  district: string
): Promise<string[]> {
  const data = await fetchLocations(state, district);
  return data.cities ?? [];
}
