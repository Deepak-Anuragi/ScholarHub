import { api } from "./api";
import { libraries } from "./mock-data";

export type LocationTree = Record<string, Record<string, string[]>>;

export function buildLocationTree(): LocationTree {
  const tree: LocationTree = {};

  for (const library of libraries) {
    if (!tree[library.state]) {
      tree[library.state] = {};
    }
    if (!tree[library.state][library.district]) {
      tree[library.state][library.district] = [];
    }
    const cities = tree[library.state][library.district];
    if (!cities.includes(library.city)) {
      cities.push(library.city);
    }
  }

  for (const state of Object.keys(tree)) {
    for (const district of Object.keys(tree[state])) {
      tree[state][district].sort();
    }
  }

  return tree;
}

export const locationTree = buildLocationTree();

export function getStates(): string[] {
  return Object.keys(locationTree).sort();
}

export function getDistricts(state?: string): string[] {
  if (!state || !locationTree[state]) return [];
  return Object.keys(locationTree[state]).sort();
}

export function getCities(state?: string, district?: string): string[] {
  if (!state || !district || !locationTree[state]?.[district]) return [];
  return locationTree[state][district];
}

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
  } catch {
    // Fallback to static location tree if API fails
    if (state && district) return { cities: getCities(state, district) };
    if (state) return { districts: getDistricts(state) };
    return { states: getStates() };
  }
}

export async function fetchStates(): Promise<string[]> {
  const data = await fetchLocations();
  return data.states ?? getStates();
}

export async function fetchDistricts(state: string): Promise<string[]> {
  const data = await fetchLocations(state);
  return data.districts ?? getDistricts(state);
}

export async function fetchCities(
  state: string,
  district: string
): Promise<string[]> {
  const data = await fetchLocations(state, district);
  return data.cities ?? getCities(state, district);
}
