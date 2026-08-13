"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { CountUp } from "@/components/home/CountUp";
import ShinyText from "@/components/ShinyText/ShinyText";
import { cn } from "@/lib/utils";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PIE_COLORS = ["#4a7c2a", "#16a34a", "#86efac"];

type PlanBreakdown = { _id: string; revenue: number; count: number };
type MonthData = { _id: { year: number; month: number }; revenue: number };
type LedgerRow = {
  _id: string;
  bookingId: { studentId: string; plan: string; amountPaid: number; createdAt: string };
  totalAmount: number;
  platformShare: number;
  ownerShare: number;
  payoutStatus: string;
};
type RevenueData = {
  planBreakdown: PlanBreakdown[];
  monthlyChart: MonthData[];
  ledger: LedgerRow[];
  allTime: number;
  thisMonth: number;
  lastMonth: number;
};

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/owner/revenue", { credentials: "include" })
      .then((r) => r.json())
      .then((d: RevenueData) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  const chartData = (data?.monthlyChart ?? []).map((d) => ({
    month: MONTH_NAMES[(d._id.month - 1) % 12],
    revenue: d.revenue,
  }));

  const pieData = (data?.planBreakdown ?? []).map((p) => ({
    name: p._id,
    value: p.revenue,
    count: p.count,
  }));

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6">
          <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
            Revenue
          </h1>
          <p className="mt-1 text-sm text-forest-900/60">
            Earnings breakdown and payout history
          </p>
        </div>
      </AnimatedContent>

      {/* Summary cards */}
      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "All Time", value: data?.allTime ?? 0, shine: false },
            { label: "This Month", value: data?.thisMonth ?? 0, shine: true },
            { label: "Last Month", value: data?.lastMonth ?? 0, shine: false },
          ].map(({ label, value, shine }) => (
            <div
              key={label}
              className="rounded-card border border-line bg-white p-5 shadow-soft"
            >
              <div className="flex items-center gap-2 text-sm text-forest-900/60">
                <TrendingUp className="size-4 text-forest-700" />
                {shine ? (
                  <ShinyText
                    text={label}
                    color="#4a7c2a"
                    shineColor="#86efac"
                    speed={3}
                    className="font-semibold"
                  />
                ) : (
                  <span className="font-semibold">{label}</span>
                )}
              </div>
              <p className="mt-2 text-3xl font-bold text-forest-900">
                ₹<CountUp end={value} duration={1.2} />
              </p>
            </div>
          ))}
        </div>
      </AnimatedContent>

      {/* Charts row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <AnimatedContent distance={22} duration={0.45} threshold={0} delay={0.1}>
          <div className="rounded-card border border-line bg-white p-5 shadow-soft">
            <p className="mb-4 text-sm font-semibold text-forest-900">
              Monthly Revenue (Last 6 Months)
            </p>
            {loading || chartData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-forest-900/40">
                {loading ? "Loading…" : "No data yet."}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d6e2d3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#253b1c99" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#253b1c99" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                  />
                  <Tooltip
                    formatter={(v) => [`₹${Number(v ?? 0).toLocaleString("en-IN")}`, "Revenue"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #d6e2d3", fontSize: 12 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </AnimatedContent>

        <AnimatedContent distance={22} duration={0.45} threshold={0} delay={0.13}>
          <div className="rounded-card border border-line bg-white p-5 shadow-soft">
            <p className="mb-4 text-sm font-semibold text-forest-900">
              Revenue by Plan
            </p>
            {loading || pieData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-forest-900/40">
                {loading ? "Loading…" : "No data yet."}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(v: string) => (
                      <span className="text-xs text-forest-900/70">{v}</span>
                    )}
                  />
                  <Tooltip
                    formatter={(v) => [`₹${Number(v ?? 0).toLocaleString("en-IN")}`, "Revenue"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #d6e2d3", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </AnimatedContent>
      </div>

      {/* Payout ledger table */}
      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.18}>
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-soft">
          <div className="border-b border-line px-5 py-3">
            <p className="text-sm font-semibold text-forest-900">Payout Ledger</p>
          </div>
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-sage-100" />
              ))}
            </div>
          ) : (data?.ledger ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-forest-900/40">
              No payout records yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-sage-100/50 text-left text-xs font-semibold uppercase tracking-wide text-forest-900/40">
                    <th className="px-5 py-2.5">Date</th>
                    <th className="px-5 py-2.5">Plan</th>
                    <th className="px-5 py-2.5">Total</th>
                    <th className="px-5 py-2.5">Platform</th>
                    <th className="px-5 py-2.5">Your Share</th>
                    <th className="px-5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.ledger.map((row) => (
                    <tr
                      key={row._id}
                      className="border-b border-line last:border-0 hover:bg-sage-100/20"
                    >
                      <td className="px-5 py-3 text-forest-900/60">
                        {new Date(row.bookingId?.createdAt ?? "").toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3 capitalize text-forest-900/70">
                        {row.bookingId?.plan?.toLowerCase() ?? "—"}
                      </td>
                      <td className="px-5 py-3 font-semibold text-forest-900">
                        ₹{row.totalAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-3 text-forest-900/60">
                        ₹{row.platformShare.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-3 font-semibold text-[#16a34a]">
                        ₹{row.ownerShare.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            row.payoutStatus === "PAID"
                              ? "bg-[#16a34a]/10 text-[#16a34a]"
                              : "bg-amber-100 text-amber-700"
                          )}
                        >
                          {row.payoutStatus}
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
