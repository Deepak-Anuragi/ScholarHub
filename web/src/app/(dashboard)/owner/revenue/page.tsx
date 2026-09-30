"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import {
  TrendingUp, Users, FileSpreadsheet, FileDown, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import AnimatedContent from "@/components/AnimatedContent";
import { DataError } from "@/components/dashboard/DataError";
import { CountUp } from "@/components/home/CountUp";
import ShinyText from "@/components/ShinyText";
import { api } from "@/lib/api";
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

type OccupancyDay = { date: string; occupancyPct: number };
type RetentionMonth = { month: string; ratePct: number };
type RetentionData = { ratePct: number; history: RetentionMonth[] };

const RevenueReportPDF = React.lazy(() =>
  import('@/components/revenue/RevenueReportPDF').then(m => ({ default: m.RevenueReportPDF }))
);

function LazyPdfExportButton({
  data, retention, loading, setLoading
}: {
  data: RevenueData | null;
  retention: RetentionData | null;
  loading: boolean;
  setLoading: (b: boolean) => void;
}) {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => { setLoading(true); setErr(null); setReady(true); }}
        disabled={loading || !data}
      >
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <FileDown className="size-3.5" />}
        Export PDF
      </Button>
      {ready && data && (
        <div style={{ display: 'none' }}>
          <React.Suspense fallback={<></>}>
            <RevenueReportPDF
              data={data}
              retention={retention}
              onError={(e) => { setLoading(false); setErr(e); }}
              onReady={() => { setLoading(false); }}
            />
          </React.Suspense>
        </div>
      )}
      {err && <p className="text-xs text-red-600">{err}</p>}
    </>
  );
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancyDay[] | null>(null);
  const [retention, setRetention] = useState<RetentionData | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rev, occ, ret] = await Promise.all([
        api.get<RevenueData>('/owner/revenue'),
        api.get<{ occupancy?: OccupancyDay[] }>('/owner/analytics/occupancy').catch(() => ({ occupancy: [] })),
        api.get<RetentionData>('/owner/analytics/retention').catch(() => ({ ratePct: 0, history: [] })),
      ]);
      setData(rev);
      setOccupancy(occ.occupancy ?? []);
      setRetention(ret);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          {[
            { label: "All Time", value: data?.allTime ?? 0, shine: false, retention: false },
            { label: "This Month", value: data?.thisMonth ?? 0, shine: true, retention: false },
            { label: "Last Month", value: data?.lastMonth ?? 0, shine: false, retention: false },
            { label: "Retention", value: null as unknown as number, shine: false, retention: true },
          ].map(({ label, value, shine, retention: isRetention }) => (
            <div
              key={label}
              className="rounded-card border border-line bg-white p-5 shadow-soft"
            >
              {isRetention ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-forest-900/60">
                    <Users className="size-4 text-forest-700" />
                    <span className="font-semibold">Retention</span>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-forest-900">{retention?.ratePct ?? 0}%</p>
                  {(retention?.history?.length ?? 0) > 0 && (
                    <div className="mt-3 h-10 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={retention!.history}>
                          <Line type="monotone" dataKey="ratePct" stroke="#16a34a" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              ) : (
                <>
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
                </>
              )}
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

      {/* Occupancy chart */}
      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.18}>
        <div className="mb-6 overflow-hidden rounded-card border border-line bg-white p-5 shadow-soft">
          <p className="mb-4 text-sm font-semibold text-forest-900">Occupancy Rate (Last 30 Days)</p>
          {loading || !occupancy || occupancy.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-forest-900/40">
              {loading ? "Loading…" : "No data yet."}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={occupancy} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d6e2d3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#253b1c99' }}
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#253b1c99' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  formatter={(v) => [`${Number(v ?? 0)}%`, "Occupancy"]}
                  labelFormatter={(l) => `Date: ${String(l ?? '')}`}
                  contentStyle={{ borderRadius: 12, border: '1px solid #d6e2d3', fontSize: 12 }}
                />
                <Bar dataKey="occupancyPct" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </AnimatedContent>

      {/* Payout ledger table */}
      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.2}>
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
            <p className="text-sm font-semibold text-forest-900">Payout Ledger</p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open('/api/owner/revenue/export.csv', '_blank')}
              >
                <FileSpreadsheet className="size-3.5" /> Export CSV
              </Button>
              <LazyPdfExportButton
                data={data}
                retention={retention}
                loading={pdfLoading}
                setLoading={setPdfLoading}
              />
            </div>
          </div>
          {error ? (
            <DataError message={error} onRetry={load} />
          ) : loading ? (
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
