"use client";

import { useEffect, useState } from "react";
import { Users, X } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { api } from "@/lib/api";

type WaitlistEntry = {
  _id: string;
  libraryId: { name: string; city: string };
  slotId?: { name: string; startTime: string; endTime: string };
  position: number;
  notified: boolean;
  heldUntil?: string;
  createdAt: string;
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function WaitlistPage() {
  const [entries, setEntries]     = useState<WaitlistEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [removing, setRemoving]   = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ entries?: WaitlistEntry[] }>("/student/waitlist")
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  const handleLeave = async (id: string) => {
    setRemoving(id);
    try {
      await api.delete(`/student/waitlist/${id}`);
      setEntries((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      console.error("Failed to leave waitlist:", err);
    } finally {
      setRemoving(null);
      setConfirmId(null);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6">
          <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
            Waitlist
          </h1>
          <p className="mt-1 text-sm text-forest-900/60">
            Libraries where you&apos;re waiting for a seat
          </p>
        </div>
      </AnimatedContent>

      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-card border border-dashed border-line bg-white/60 py-14 text-center">
            <Users className="mx-auto size-8 text-forest-900/20" />
            <p className="mt-3 text-sm font-semibold text-forest-900">
              Not on any waitlist
            </p>
            <p className="mt-1 text-xs text-forest-900/50">
              Join a waitlist from a library&apos;s detail page when seats are full.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((e) => (
              <div
                key={e._id}
                className="rounded-2xl border border-line bg-white p-4 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-forest-900">
                        {e.libraryId.name}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          e.notified
                            ? "bg-[#16a34a]/10 text-[#16a34a]"
                            : "bg-amber-100 text-amber-700"
                        )}
                      >
                        #{e.position} in queue
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-forest-900/50">
                      {e.libraryId.city}
                      {e.slotId &&
                        ` · ${e.slotId.name} (${e.slotId.startTime}–${e.slotId.endTime})`}
                    </p>
                    <p className="mt-1 text-xs text-forest-900/40">
                      Joined {fmt(e.createdAt)}
                    </p>
                    {e.notified && (
                      <p className="mt-2 text-xs font-semibold text-[#16a34a]">
                        ✓ A seat is available — book now before it&apos;s gone!
                      </p>
                    )}
                    {e.heldUntil && new Date(e.heldUntil) > new Date() && (
                      <p className="mt-1 text-xs text-amber-600">
                        Seat held until {fmt(e.heldUntil)}
                      </p>
                    )}
                  </div>

                  {/* Leave button / confirm */}
                  {confirmId === e._id ? (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmId(null)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => void handleLeave(e._id)}
                        disabled={removing === e._id}
                        className="bg-red-500 text-xs text-white hover:bg-red-600"
                      >
                        {removing === e._id ? "Leaving…" : "Confirm"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmId(e._id)}
                      className="shrink-0 text-xs text-red-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="size-3" />
                      Leave
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </AnimatedContent>
    </div>
  );
}
