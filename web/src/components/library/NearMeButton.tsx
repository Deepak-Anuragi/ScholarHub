"use client";

import { Loader2, MapPin, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export interface NearMeButtonProps {
  onLocation: (coords: { lat: number; lng: number; radius: number }) => void;
  onClear: () => void;
  isActive?: boolean;
}

type GeoState = "idle" | "loading" | "active" | "error";

/**
 * NearMeButton — Requirement 1.11, 1.13
 *
 * Requests the browser's current position and passes it upward as
 * { lat, lng, radius: 10 } via the onLocation callback.
 * Shows an inline error when permission is denied (Req 1.13).
 */
export function NearMeButton({ onLocation, onClear, isActive = false }: NearMeButtonProps) {
  const [geoState, setGeoState] = useState<GeoState>(isActive ? "active" : "idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNearMe = () => {
    if (geoState === "active") {
      // Already active — let the Clear button handle clearing
      return;
    }

    if (!navigator.geolocation) {
      setGeoState("error");
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setGeoState("loading");
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoState("active");
        onLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          radius: 10,
        });
      },
      () => {
        setGeoState("error");
        setErrorMsg("Location access was denied. The Near Me filter will not apply.");
      },
      { timeout: 10_000 }
    );
  };

  const handleClear = () => {
    setGeoState("idle");
    setErrorMsg(null);
    onClear();
  };

  const isLoading = geoState === "loading";
  const isCurrentlyActive = geoState === "active" || isActive;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {/* Near Me trigger button */}
        <button
          type="button"
          onClick={handleNearMe}
          disabled={isLoading}
          aria-label={isCurrentlyActive ? "Near Me filter active" : "Use my current location"}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition",
            isLoading && "cursor-not-allowed opacity-60",
            isCurrentlyActive
              ? "border-[#16a34a] bg-[#16a34a]/10 text-[#16a34a]"
              : "border-line bg-white text-forest-900/80 hover:border-[#16a34a] hover:text-[#16a34a]"
          )}
        >
          {isLoading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <MapPin className="size-3.5" />
          )}
          {isLoading ? "Locating…" : "Near Me"}
        </button>

        {/* Clear button — only shown when location is active */}
        {isCurrentlyActive && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear Near Me filter"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-forest-900/60 transition hover:border-red-300 hover:text-red-500"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Inline error message — Requirement 1.13 */}
      {geoState === "error" && errorMsg && (
        <p role="alert" className="text-xs text-red-600">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
