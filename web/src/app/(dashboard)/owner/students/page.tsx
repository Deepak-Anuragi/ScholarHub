"use client";

import { useEffect, useState } from "react";
import { Search, Users } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { cn } from "@/lib/utils";

type StudentBooking = {
  _id: string;
  studentId: { _id: string; name: string; email: string; phone?: string; avatarUrl?: string };
  slotId?: { name: string };
  plan: string;
  endDate: string;
};

export default function StudentsPage() {
  const [bookings, setBookings] = useState<StudentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/owner/bookings", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { bookings?: StudentBooking[] }) => {
        // Show only active students
        const active = (d.bookings ?? []).filter(
          (b: { status?: string }) => b.status === "ACTIVE"
        ) as StudentBooking[];
        setBookings(active);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = bookings.filter(
    (b) =>
      !query ||
      b.studentId?.name?.toLowerCase().includes(query.toLowerCase()) ||
      b.studentId?.email?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6">
          <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
            Current Students
          </h1>
          <p className="mt-1 text-sm text-forest-900/60">
            {bookings.length} active student{bookings.length !== 1 ? "s" : ""} in your library
          </p>
        </div>
      </AnimatedContent>

      <AnimatedContent distance={20} duration={0.4} threshold={0} delay={0.05}>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-forest-900/40" />
          <input
            type="text"
            placeholder="Search students…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full max-w-sm rounded-xl border border-line bg-white pl-9 pr-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
          />
        </div>
      </AnimatedContent>

      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.08}>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-card border border-dashed border-line bg-white/60 py-14 text-center">
            <Users className="mx-auto size-8 text-forest-900/20" />
            <p className="mt-3 text-sm text-forest-900/50">
              {query ? "No students match your search." : "No active students right now."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b) => {
              const initials = (b.studentId?.name ?? "S")
                .split(" ")
                .slice(0, 2)
                .map((p) => p[0])
                .join("")
                .toUpperCase();
              const daysLeft = Math.max(
                0,
                Math.ceil((new Date(b.endDate).getTime() - Date.now()) / 86_400_000)
              );
              return (
                <div
                  key={b._id}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest-700/10 text-sm font-bold text-forest-700">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-forest-900">
                      {b.studentId?.name ?? "—"}
                    </p>
                    <p className="truncate text-xs text-forest-900/50">
                      {b.studentId?.email}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                      {b.slotId?.name && (
                        <span className="rounded-full bg-sage-100 px-2 py-0.5 font-medium text-forest-900">
                          {b.slotId.name}
                        </span>
                      )}
                      <span className="rounded-full bg-sage-100 px-2 py-0.5 capitalize font-medium text-forest-900">
                        {b.plan.toLowerCase()}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-semibold",
                          daysLeft <= 7
                            ? "bg-amber-100 text-amber-700"
                            : "text-forest-900/50"
                        )}
                      >
                        {daysLeft}d left
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AnimatedContent>
    </div>
  );
}
