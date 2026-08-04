"use client";

import { useEffect, useState } from "react";
import { CreditCard, Download, Loader2, TrendingUp } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { CountUp } from "@/components/home/CountUp";
import { Button } from "@/components/ui/button";
import { downloadCSV } from "@/lib/csv";
import { cn } from "@/lib/utils";

type LedgerRow = {
  _id: string;
  bookingId: string | null;
  libraryId: { name: string; city: string } | null;
  ownerId: { name: string } | null;
  totalAmount: number;
  commissionRate: number;
  platformShare: number;
  ownerShare: number;
  payoutStatus: "PENDING" | "PAID";
  createdAt: string;
};

type RevenueData = {
  ledger: LedgerRow[];
  thisMonth:  { platform: number; owner: number };
  thisYear:   { platform: number; owner: number };
  allTime:    { platform: number; total: number };
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/revenue", { credentials: "include" })
      .then((r) => r.json())
      .then((d: RevenueData) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkPaid = async (id: string) => {
    setMarking(id);
    await fetch(`/api/admin/payouts/${id}`, { method: "PATCH", credentials: "include" });
    setData((prev) =>
      prev
        ? {
            ...prev,
            ledger: prev.ledger.map((r) =>
              r._id === id ? { ...r, payoutStatus: "PAID" as const } : r
            ),
          }
        : prev
    );
    setMarking(null);
  };

  const handleExport = () => {
    downloadCSV(
      (data?.ledger ?? []).map((r) => ({
        date: fmt(r.createdAt),
        bookingId: r.bookingId ?? "",
        library: r.libraryId?.name ?? "—",
        owner: r.ownerId?.name ?? "—",
        totalAmount: r.totalAmount,
        commissionRate: `${(r.commissionRate * 100).toFixed(0)}%`,
        platformShare: r.platformShare,
        ownerShare: r.ownerShare,
        payoutStatus: r.payoutStatus,
      })),
      "scholarshub-payouts.csv"
    );
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">Revenue & Payouts</h1>
            <p className="mt-1 text-sm text-forest-900/60">Platform commission and owner payout tracking</p>
          </div>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="size-3.5" /> Export CSV
          </Button>
        </div>
      </AnimatedContent>

      {/* KPI cards */}
      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Platform — This Month", value: data?.thisMonth.platform ?? 0, icon: TrendingUp },
            { label: "Platform — This Year",  value: data?.thisYear.platform  ?? 0, icon: TrendingUp },
            { label: "Platform — All Time",   value: data?.allTime.platform   ?? 0, icon: CreditCard },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-card border border-line bg-white p-5 shadow-soft">
              <div className="flex items-center gap-2 text-sm text-forest-900/60">
                <Icon className="size-4 text-forest-900" />
                <span className="font-semibold">{label}</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-forest-900">
                ₹<CountUp end={value} duration={1.2} />
              </p>
            </div>
          ))}
        </div>
      </AnimatedContent>

      {/* Payout ledger */}
      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.1}>
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-soft">
          <div className="border-b border-line px-5 py-3">
            <p className="text-sm font-semibold text-forest-900">Commission Ledger</p>
          </div>
          {loading ? (
            <div className="flex h-52 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-forest-900/40" />
            </div>
          ) : (data?.ledger ?? []).length === 0 ? (
            <p className="py-10 text-center text-sm text-forest-900/40">No payout records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-sage-100/50 text-left text-xs font-semibold uppercase tracking-wide text-forest-900/40">
                    {["Date","Booking ID","Library","Owner","Total","Commission","Platform","Owner Share","Status",""].map((h) => (
                      <th key={h} className="px-4 py-2.5 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.ledger.map((row) => (
                    <tr key={row._id} className="border-b border-line last:border-0 hover:bg-sage-100/20">
                      <td className="px-4 py-3 text-forest-900/60 whitespace-nowrap">{fmt(row.createdAt)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-forest-900/50 whitespace-nowrap">
                        {row.bookingId ? row.bookingId.slice(-8) : "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-forest-900 whitespace-nowrap">{row.libraryId?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-forest-900/70 whitespace-nowrap">{row.ownerId?.name ?? "—"}</td>
                      <td className="px-4 py-3 font-semibold text-forest-900">₹{row.totalAmount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-forest-900/60">{(row.commissionRate * 100).toFixed(0)}%</td>
                      <td className="px-4 py-3 font-semibold text-forest-900">₹{row.platformShare.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-[#16a34a] font-semibold">₹{row.ownerShare.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          row.payoutStatus === "PAID"
                            ? "bg-[#16a34a]/10 text-[#16a34a]"
                            : "bg-amber-100 text-amber-700"
                        )}>
                          {row.payoutStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {row.payoutStatus === "PENDING" && (
                          <button
                            type="button"
                            disabled={marking === row._id}
                            onClick={() => void handleMarkPaid(row._id)}
                            className="rounded-full bg-forest-900 px-2.5 py-1 text-[10px] font-semibold text-white transition hover:bg-forest-700 disabled:opacity-50"
                          >
                            {marking === row._id ? <Loader2 className="size-3 animate-spin inline" /> : "Mark Paid"}
                          </button>
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
