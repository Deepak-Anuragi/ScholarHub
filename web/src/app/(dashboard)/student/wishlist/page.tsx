"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, GitCompare, Trash2 } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { LibraryCard } from "@/components/library/LibraryCard";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { LibraryItem } from "@/lib/libraries-query";

export default function WishlistPage() {
  const [libraries, setLibraries] = useState<LibraryItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [removing, setRemoving]   = useState<string | null>(null);

  useEffect(() => {
    api.get<{ wishlist: LibraryItem[] }>("/student/wishlist")
      .then((d) => setLibraries(d.wishlist ?? []))
      .catch(() => setLibraries([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleRemove = async (libraryId: string) => {
    setRemoving(libraryId);
    try {
      await api.delete(`/student/wishlist/${libraryId}`);
      setLibraries((prev) => prev.filter((l) => (l._id ?? l.id)?.toString() !== libraryId));
      setSelected((prev) => { const next = new Set(prev); next.delete(libraryId); return next; });
    } catch { /* non-critical */ } finally { setRemoving(null); }
  };

  const compareIds = Array.from(selected).slice(0, 2);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">Saved Libraries</h1>
            <p className="mt-1 text-sm text-forest-900/60">{libraries.length} saved</p>
          </div>
          {selected.size === 2 && (
            <Button asChild className="gap-2 bg-[#16a34a] text-white hover:bg-[#15803d]">
              <Link href={`/student/compare?ids=${compareIds.join(",")}`}>
                <GitCompare className="size-4" /> Compare Selected
              </Link>
            </Button>
          )}
        </div>
      </AnimatedContent>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map((i) => <div key={i} className="h-64 animate-pulse rounded-card bg-white" />)}
        </div>
      ) : libraries.length === 0 ? (
        <div className="flex flex-col items-center rounded-card border border-dashed border-line bg-white/60 px-6 py-16 text-center">
          <Bookmark className="mx-auto size-10 text-forest-900/30" />
          <p className="mt-3 text-sm font-semibold text-forest-900">No saved libraries yet</p>
          <p className="mt-1 text-sm text-forest-900/50">Browse libraries to save your favourites.</p>
          <Button asChild className="mt-4 bg-[#16a34a] text-white hover:bg-[#15803d]" size="sm">
            <Link href="/libraries">Browse Libraries</Link>
          </Button>
        </div>
      ) : (
        <>
          {selected.size === 1 && (
            <p className="mb-4 text-sm text-forest-900/60">Select one more library to compare.</p>
          )}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {libraries.map((lib, i) => {
              const id = (lib._id ?? lib.id)?.toString() ?? "";
              const isSelected = selected.has(id);
              return (
                <AnimatedContent key={id} distance={20} duration={0.4} delay={i * 0.05} threshold={0}>
                  <div className={`relative rounded-card border-2 transition ${isSelected ? "border-[#16a34a]" : "border-transparent"}`}>
                    <div className="absolute right-3 top-3 z-10 flex gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSelect(id)}
                        className={`flex size-7 items-center justify-center rounded-full border-2 text-xs font-bold transition ${isSelected ? "border-[#16a34a] bg-[#16a34a] text-white" : "border-line bg-white text-forest-900/50 hover:border-[#16a34a]"}`}
                        aria-label={isSelected ? "Deselect" : "Select for comparison"}
                      >
                        {isSelected ? "✓" : ""}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRemove(id)}
                        disabled={removing === id}
                        className="flex size-7 items-center justify-center rounded-full border border-line bg-white text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <LibraryCard library={lib} view="grid" />
                  </div>
                </AnimatedContent>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}