import {
  libraries,
  libraryDetails,
  libraryReviews,
  librarySlots,
  LibraryDetail,
  LibrarySummary,
  Review,
  Slot,
} from "./mock-data";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchLibraries(): Promise<LibrarySummary[]> {
  await sleep(350);
  return libraries;
}

export async function fetchLibraryById(
  id: string
): Promise<LibraryDetail | null> {
  await sleep(350);
  return libraryDetails[id] ?? null;
}

export async function fetchLibrarySlots(id: string): Promise<Slot[]> {
  await sleep(200);
  return librarySlots[id] ?? [];
}

export async function fetchLibraryReviews(id: string): Promise<Review[]> {
  await sleep(200);
  return libraryReviews[id] ?? [];
}
