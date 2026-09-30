/**
 * Pure helper for deriving a library seat map from total seat count and
 * the set of currently-occupied seat numbers.
 *
 * Grid convention (10 seats per row):
 *   i  = 1-indexed seat position (1 … totalSeats)
 *   row    = Math.ceil(i / 10)               → 1, 1, …, 2, 2, …
 *   column = ((i - 1) % 10) + 1             → 1…10, 1…10, …
 *   seatNumber = "{rowLetter}{column}"      → "A1", "A2", … "A10", "B1", …
 *   rowLetter  = String.fromCharCode(64 + row) → A, B, C, …
 */

export type SeatStatus = "available" | "occupied";

export interface SeatObject {
  /** e.g. "A1", "A2", ... "A10", "B1", ... */
  seatNumber: string;
  row: number;
  column: number;
  status: SeatStatus;
}

/**
 * Build a complete seat map for a library.
 *
 * @param totalSeats          - Total number of physical seats in the library.
 * @param occupiedSeatNumbers - Seat numbers that have an ACTIVE booking.
 * @returns An array of `SeatObject` whose length equals `totalSeats`.
 */
export function buildSeatMap(
  totalSeats: number,
  occupiedSeatNumbers: string[]
): SeatObject[] {
  const occupiedSet = new Set(occupiedSeatNumbers);
  const seats: SeatObject[] = [];

  for (let i = 1; i <= totalSeats; i++) {
    const row = Math.ceil(i / 10);
    const column = ((i - 1) % 10) + 1;
    const rowLetter = String.fromCharCode(64 + row); // A=65-1, B=66-1, …
    const seatNumber = `${rowLetter}${column}`;

    seats.push({
      seatNumber,
      row,
      column,
      status: occupiedSet.has(seatNumber) ? "occupied" : "available",
    });
  }

  return seats;
}
