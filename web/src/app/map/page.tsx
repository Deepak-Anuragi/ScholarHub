"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { LocateFixed, MapPin, SlidersHorizontal, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type MapLibrary = {
  _id: string;
  name: string;
  city: string;
  lat?: number;
  lng?: number;
  availableSeats: number;
  ratingAvg: number;
  monthlyFee: number;
  photos?: { url: string; isCover?: boolean }[];
};

const examTypes = ["Govt Exam", "Entrance Exam", "School", "Professional"];
const distanceOptions = [1, 5, 10, 20];
const defaultCenter = { lat: 20.5937, lng: 78.9629 };

function pinColor(seats: number) {
  return seats === 0 ? "#dc2626" : seats <= 5 ? "#eab308" : "#16a34a";
}

export default function MapPage() {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [libraries, setLibraries] = useState<MapLibrary[]>([]);
  const [examType, setExamType] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [radius, setRadius] = useState(10);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (examType) params.set("examType", examType);
    if (availableOnly) params.set("available_only", "true");
    if (location) {
      params.set("lat", String(location.lat));
      params.set("lng", String(location.lng));
      params.set("radius", String(radius));
    }
    const loadingTask = window.setTimeout(() => setLoading(true), 0);
    api.get<{ libraries?: MapLibrary[] }>(`/libraries/map?${params.toString()}`)
      .then((data) => { if (!cancelled) setLibraries(data.libraries ?? []); })
      .catch(() => { if (!cancelled) setLibraries([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; window.clearTimeout(loadingTask); };
  }, [availableOnly, examType, location, radius]);

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      window.setTimeout(() => setError("Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to display the map."), 0);
      return;
    }
    setOptions({ key: apiKey, v: "weekly" });
    Promise.all([importLibrary("maps"), importLibrary("marker")]).then(() => {
      if (!mapElement.current) return;
      mapRef.current = new google.maps.Map(mapElement.current, {
        center: defaultCenter, zoom: 5, mapTypeControl: false, streetViewControl: false,
      });
      infoWindowRef.current = new google.maps.InfoWindow();
    }).catch(() => setError("Google Maps could not be loaded."));
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    clustererRef.current?.clearMarkers();
    const infoWindow = infoWindowRef.current ?? new google.maps.InfoWindow();
    infoWindowRef.current = infoWindow;
    const markers = libraries
      .filter((library) => typeof library.lat === "number" && typeof library.lng === "number")
      .map((library) => {
        const marker = new google.maps.Marker({
          position: { lat: library.lat!, lng: library.lng! }, title: library.name,
          icon: { path: google.maps.SymbolPath.CIRCLE, fillColor: pinColor(library.availableSeats), fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2, scale: 9 },
        });
        marker.addListener("click", () => {
          const cover = library.photos?.find((photo) => photo.isCover)?.url;
          infoWindow.setContent(`<div style="max-width:240px;font-family:Arial,sans-serif;color:#173b2c">${cover ? `<img src="${cover}" alt="" style="width:100%;height:92px;object-fit:cover;border-radius:8px;margin-bottom:8px" />` : ""}<strong>${library.name}</strong><div style="margin-top:5px;font-size:12px">${library.city}</div><div style="margin-top:7px;font-size:12px">★ ${library.ratingAvg.toFixed(1)} · ${library.availableSeats} seats available</div><div style="margin-top:4px;font-size:12px">₹${library.monthlyFee.toLocaleString("en-IN")}/month</div><a href="/library/${library._id}" style="display:inline-block;margin-top:10px;color:#15803d;font-weight:600;font-size:12px">View Details</a></div>`);
          infoWindow.open({ map, anchor: marker });
        });
        return marker;
      });
    clustererRef.current = new MarkerClusterer({ map, markers });
    if (location) map.setCenter(location);
    return () => { clustererRef.current?.clearMarkers(); };
  }, [libraries, location]);

  const useLocation = () => {
    if (!navigator.geolocation) { setError("Location is not available in this browser."); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setLocation({ lat: coords.latitude, lng: coords.longitude }),
      () => setError("Allow location access to search nearby libraries."),
    );
  };

  return (
    <main className="min-h-screen bg-sand-100 px-4 py-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-forest-900/60">Live seat map</p><h1 className="mt-2 font-display text-3xl text-forest-900 sm:text-4xl">Find your next study spot.</h1></div><Button variant="outline" className="lg:hidden" onClick={() => setFiltersOpen((open) => !open)}><SlidersHorizontal className="size-4" /> Filters</Button></div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="overflow-hidden rounded-card border border-line bg-white shadow-soft"><div ref={mapElement} className="h-[min(68vh,620px)] min-h-[420px] bg-sage-100" />{error ? <div className="border-t border-line px-4 py-3 text-sm text-red-600">{error}</div> : null}<div className="flex flex-wrap gap-4 border-t border-line px-4 py-3 text-xs text-forest-900/70"><span><i className="mr-1.5 inline-block size-2 rounded-full bg-[#16a34a]" />6+ seats</span><span><i className="mr-1.5 inline-block size-2 rounded-full bg-[#eab308]" />1–5 seats</span><span><i className="mr-1.5 inline-block size-2 rounded-full bg-[#dc2626]" />Full</span></div></section>
          <aside className={cn("rounded-card border border-line bg-white p-5 shadow-soft", !filtersOpen && "hidden lg:block")}><div className="flex items-center justify-between"><h2 className="font-semibold text-forest-900">Map filters</h2><span className="text-xs text-forest-900/50">{loading ? "Loading" : `${libraries.length} results`}</span></div>
            <label className="mt-5 grid gap-2 text-sm font-semibold text-forest-900">Exam type<select value={examType} onChange={(event) => setExamType(event.target.value)} className="h-10 rounded-xl border border-line bg-white px-3 font-normal outline-none"><option value="">All exam types</option>{examTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label className="mt-5 flex items-center justify-between text-sm font-semibold text-forest-900">Available seats only<input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} className="size-4 accent-[#16a34a]" /></label>
            <label className="mt-5 grid gap-2 text-sm font-semibold text-forest-900">Distance {location ? `within ${radius} km` : "(use location first)"}<select value={radius} onChange={(event) => setRadius(Number(event.target.value))} disabled={!location} className="h-10 rounded-xl border border-line bg-white px-3 font-normal outline-none disabled:opacity-50">{distanceOptions.map((distance) => <option key={distance} value={distance}>{distance} km</option>)}</select></label>
            <Button onClick={useLocation} className="mt-6 w-full bg-forest-700 text-white hover:bg-forest-900"><LocateFixed className="size-4" /> Use My Location</Button>
            <div className="mt-7 border-t border-line pt-5"><div className="flex items-center justify-between"><h2 className="font-semibold text-forest-900">Libraries</h2><MapPin className="size-4 text-forest-700" /></div><div className="mt-3 grid gap-2">{libraries.slice(0, 8).map((library) => <Link key={library._id} href={`/library/${library._id}`} className="flex items-center justify-between rounded-xl border border-line p-3 transition hover:border-forest-700"><span className="min-w-0"><strong className="block truncate text-sm text-forest-900">{library.name}</strong><span className="text-xs text-forest-900/55">{library.city}</span></span><span className="ml-2 shrink-0 text-xs text-forest-900/60"><Star className="mr-1 inline size-3 fill-current" />{library.ratingAvg.toFixed(1)}</span></Link>)}{!loading && libraries.length === 0 ? <p className="text-sm text-forest-900/55">No libraries match these filters.</p> : null}</div></div>
+          </aside>
+        </div>
+      </div>
+    </main>
  );
}
