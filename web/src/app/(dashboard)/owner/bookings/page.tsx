"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { DataError } from "@/components/dashboard/DataError";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Booking = {
  _id: string;
  studentId: { name: string; email: string; phone?: string };
  slotId?: { name: string; startTime: string; endTime: string };
  plan: string;
  amountPaid: number;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  paymentStatus: string;
  startDate: string;
  endDate: string;
  createdAt: string;
};

const STATUS_CLS: Record<string, string> = {
  ACTIVE: "bg-[#16a34a]/10 text-[#16a34a]",
  EXPIRED: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-red-100 text-red-600",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function OwnerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get<{ bookings?: Booking[] }>("/owner/bookings")
      .then((d) => setBookings(d.bookings ?? []))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Something went wrong.")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = bookings.filter((b) => {
    const matchQ =
      !query ||
      b.studentId?.name?.toLowerCase().includes(query.toLowerCase()) ||
      b.studentId?.email?.toLowerCase().includes(query.toLowerCase());
    const matchS = statusFilter === "ALL" || b.status === statusFilter;
    return matchQ && matchS;
  });

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6">
          <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
            All Bookings
          </h1>
          <p className="mt-1 text-sm text-forest-900/60">
            Every reservation made at your library
          </p>
        </div>
      </AnimatedContent>

      {/* Filters */}
      <AnimatedContent distance={20} duration={0.4} threshold={0} delay={0.05}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-forest-900/40" />
            <input
              type="text"
              placeholder="Search by student name or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
            />
          </div>
          <div className="flex gap-2">
            {["ALL", "ACTIVE", "EXPIRED", "CANCELLED"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  statusFilter === s
                    ? "bg-forest-700 text-white"
                    : "bg-white border border-line text-forest-900/60 hover:border-forest-700/40"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </AnimatedContent>

      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.08}>
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-soft">
          {error ? (
            <DataError message={error} onRetry={load} />
          ) : loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-sage-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-forest-900/40">
              No bookings found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-sage-100/50 text-left text-xs font-semibold uppercase tracking-wide text-forest-900/40">
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Slot</th>
                    <th className="px-5 py-3">Plan</th>
                    <th className="px-5 py-3">Dates</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr key={b._id} className="border-b border-line last:border-0 hover:bg-sage-100/20">
                      <td className="px-5 py-3">
                        <p className="font-medium text-forest-900">{b.studentId?.name ?? "—"}</p>
                        <p className="text-xs text-forest-900/50">{b.studentId?.email}</p>
                      </td>
                      <td className="px-5 py-3 text-forest-900/70">
                        {b.slotId?.name ?? "—"}
                        {b.slotId && (
                          <p className="text-xs text-forest-900/40">
                            {b.slotId.startTime}–{b.slotId.endTime}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 capitalize text-forest-900/70">
                        {b.plan.toLowerCase()}
                      </td>
                      <td className="px-5 py-3 text-xs text-forest-900/60">
                        {fmt(b.startDate)} →<br />{fmt(b.endDate)}
                      </td>
                      <td className="px-5 py-3 font-semibold text-forest-900">
                        ₹{b.amountPaid.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_CLS[b.status] ?? "bg-sage-100 text-forest-900/60")}>
                          {b.status}
                        </span>
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
