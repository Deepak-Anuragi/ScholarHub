"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";

type WaitlistEntry = {
  _id: string;
  libraryId: { name: string; city: string };
  slotId?: { name: string; startTime: string; endTime: string };
  position: number;
  notified: boolean;
  createdAt: string;
};

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: add GET /api/student/waitlist endpoint
    setLoading(false);
  }, []);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6">
          <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
            Waitlist
          </h1>
          <p className="mt-1 text-sm text-forest-900/60">
            Libraries where you're waiting for a seat
          </p>
        </div>
      </AnimatedContent>

      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
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
              Join a waitlist from a library's detail page when seats are full.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((e) => (
              <div
                key={e._id}
                className="rounded-2xl border border-line bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-forest-900">
                      {e.libraryId.name}
                    </p>
                    <p className="text-xs text-forest-900/50">
                      {e.libraryId.city}
                      {e.slotId &&
                        ` · ${e.slotId.name} (${e.slotId.startTime}–${e.slotId.endTime})`}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    #{e.position} in queue
                  </span>
                </div>
                {e.notified && (
                  <p className="mt-2 text-xs font-semibold text-[#16a34a]">
                    ✓ Seat available — book now!
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </AnimatedContent>
    </div>
  );
}
