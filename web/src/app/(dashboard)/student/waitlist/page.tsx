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

function statusLabel(entry: WaitlistEntry): string {
  if (entry.notified) return "Seat available";
  return "Waiting";
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
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
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-soft">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-sage-100" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="py-14 text-center">
              <Users className="mx-auto size-8 text-forest-900/20" />
              <p className="mt-3 text-sm font-semibold text-forest-900">
                Not on any waitlist
              </p>
              <p className="mt-1 text-xs text-forest-900/50">
                Join a waitlist from a library&apos;s detail page when seats are full.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-sage-100/60 text-left text-xs font-semibold uppercase tracking-wide text-forest-900/50">
                    <th className="px-4 py-3">Library</th>
                    <th className="px-4 py-3">Slot</th>
                    <th className="px-4 py-3">Position</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry._id}
                      className="border-b border-line last:border-0 hover:bg-sage-100/30"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-forest-900">
                          {entry.libraryId.name}
                        </p>
                        <p className="text-xs text-forest-900/50">
                          {entry.libraryId.city}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-forest-900/70">
                        {entry.slotId
                          ? `${entry.slotId.name} (${entry.slotId.startTime}–${entry.slotId.endTime})`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-forest-900">
                        #{entry.position}
                      </td>
                      <td className="px-4 py-3 text-forest-900/70">
                        {fmt(entry.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            entry.notified
                              ? "bg-[#16a34a]/10 text-[#16a34a]"
                              : "bg-amber-100 text-amber-700"
                          )}
                        >
                          {statusLabel(entry)}
                        </span>
                        {entry.heldUntil && new Date(entry.heldUntil) > new Date() ? (
                          <p className="mt-1 text-[11px] text-amber-600">
                            Held until {fmt(entry.heldUntil)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {confirmId === entry._id ? (
                          <div className="flex justify-end gap-2">
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
                              onClick={() => void handleLeave(entry._id)}
                              disabled={removing === entry._id}
                              className="bg-red-500 text-xs text-white hover:bg-red-600"
                            >
                              {removing === entry._id ? "Leaving…" : "Confirm"}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmId(entry._id)}
                            className="text-xs text-red-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                          >
                            <X className="mr-1 size-3" />
                            Leave Waitlist
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AnimatedContent>
    </div>
  );
}
