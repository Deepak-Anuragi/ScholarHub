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
