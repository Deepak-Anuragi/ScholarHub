"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// --- Types -------------------------------------------------------------------

interface SeatObject {
  seatNumber: string;
  row: number;
  column: number;
  status: "available" | "occupied";
}

interface SeatMapApiResponse {
  totalSeats: number;
  seats: SeatObject[];
}

export interface SeatMapProps {
  libraryId: string;
  slotId?: string;
  selectedSeat?: string;
  onSelectSeat: (seatNumber: string | undefined) => void;
}

// --- Skeleton ----------------------------------------------------------------

function SeatMapSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading seat map">
      <div className="grid grid-cols-10 gap-1.5">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square w-full animate-pulse rounded bg-sage-100"
          />
        ))}
      </div>
    </div>
  );
}

// --- Individual seat button --------------------------------------------------

interface SeatButtonProps {
  seat: SeatObject;
  isSelected: boolean;
  onSelect: () => void;
}

function SeatButton({ seat, isSelected, onSelect }: SeatButtonProps) {
  const isOccupied = seat.status === "occupied";

  return (
    <button
      type="button"
      disabled={isOccupied}
      onClick={onSelect}
      title={`Seat ${seat.seatNumber}${isOccupied ? " (Occupied)" : ""}`}
      aria-label={`Seat ${seat.seatNumber}, ${isOccupied ? "occupied" : isSelected ? "selected" : "available"}`}
      aria-pressed={isSelected}
      className={cn(
        "aspect-square w-full rounded text-[9px] font-semibold transition-all",
        isOccupied
          ? "cursor-not-allowed bg-sage-200 text-forest-900/30"
          : isSelected
          ? "bg-[#16a34a] text-white ring-2 ring-[#16a34a] ring-offset-1"
          : "border border-[#16a34a]/60 bg-white text-forest-900/70 hover:border-[#16a34a] hover:bg-[#16a34a]/10"
      )}
    >
      {seat.seatNumber}
    </button>
  );
}

// --- Legend ------------------------------------------------------------------

function SeatLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-forest-900/70">
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-4 rounded border border-[#16a34a]/60 bg-white" />
        Available
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-4 rounded bg-sage-200" />
        Occupied
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-4 rounded bg-[#16a34a] ring-2 ring-[#16a34a] ring-offset-1" />
        Selected
      </span>
    </div>
  );
}

// --- Main component ----------------------------------------------------------

/**
 * SeatMap fetches and renders the seat layout for a library slot.
 * Seats are displayed in a CSS grid derived from the row/column data
 * returned by GET /api/libraries/:id/seat-map.
 *
 * Requirements: 5.6
 */
export function SeatMap({ libraryId, slotId, selectedSeat, onSelectSeat }: SeatMapProps) {
  const [seats, setSeats] = useState<SeatObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const url = slotId
      ? `/api/libraries/${libraryId}/seat-map?slot=${encodeURIComponent(slotId)}`
      : `/api/libraries/${libraryId}/seat-map`;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "Failed to load seat map.");
        }
        const data = (await res.json()) as SeatMapApiResponse;
        if (!cancelled) setSeats(data.seats);
      } catch (err: unknown) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Could not load seat map.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [libraryId, slotId]);

  const handleSelect = (seatNumber: string) => {
    // Toggle: clicking the already-selected seat de-selects it
    onSelectSeat(selectedSeat === seatNumber ? undefined : seatNumber);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-forest-900">Choose Seat (optional)</p>
        <SeatMapSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (seats.length === 0) {
    return null;
  }

  // Determine max column count to size the grid
  const maxCol = seats.reduce((m, s) => Math.max(m, s.column), 0);
  const cols = Math.min(maxCol, 10);

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-forest-900">Choose Seat (optional)</p>

      {/* Seat grid */}
      <div
        className="rounded-2xl border border-line bg-sage-100/40 p-4"
        role="group"
        aria-label="Seat selection grid"
      >
        {/* "Screen / Front" orientation label */}
        <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-widest text-forest-900/40">
          ← Front / Entrance →
        </p>

        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {seats.map((seat) => (
            <SeatButton
              key={seat.seatNumber}
              seat={seat}
              isSelected={selectedSeat === seat.seatNumber}
              onSelect={() => handleSelect(seat.seatNumber)}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <SeatLegend />

      {/* Selected seat indicator */}
      {selectedSeat && (
        <p className="text-sm text-forest-900/70">
          Selected:{" "}
          <span className="font-semibold text-[#16a34a]">Seat {selectedSeat}</span>
          <button
            type="button"
            onClick={() => onSelectSeat(undefined)}
            className="ml-2 text-xs text-forest-900/40 underline hover:text-forest-900/70"
          >
            Clear
          </button>
        </p>
      )}
    </div>
  );
}
