"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { ArrowRight, BookMarked, Building2, CheckCircle, CreditCard, TrendingUp, Users } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { DataError } from "@/components/dashboard/DataError";
import { api } from "@/lib/api";
import { CountUp } from "@/components/home/CountUp";
import GradientText from "@/components/GradientText";
import ShinyText from "@/components/ShinyText";
import { cn } from "@/lib/utils";

const MONTH = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PIE_COLORS = ["#253b1c","#4a7c2a","#16a34a","#86efac","#a8d8b9","#d1e8d2","#b7c9b2"];

type Stats = {
  totalLibraries: number;
  verifiedLibraries: number;
  totalStudents: number;
  activeBookings: number;
  platformRevenue: number;
  pendingPayouts: number;
  revenueChart: { _id: { year: number; month: number }; total: number }[];
  topCities: { _id: string; count: number }[];
  examDist: { _id: string | null; count: number }[];
};

function StatCard({
  icon: Icon,
  label,
  value,
  prefix = "",
  href,
  accent,
  gradient,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  prefix?: string;
  href?: string;
  accent?: boolean;
  gradient?: boolean;
}) {
  const inner = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-card border border-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift",
        accent && "border-forest-900/20 bg-gradient-to-br from-white to-sage-100/40"
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn("flex size-10 items-center justify-center rounded-2xl", accent ? "bg-forest-900/10" : "bg-sage-100")}>
          <Icon className={cn("size-5", accent ? "text-forest-900" : "text-forest-900/60")} aria-hidden />
        </div>
        {href && <ArrowRight className="size-4 text-forest-900/20 transition group-hover:text-forest-900" />}
      </div>
      <p className="mt-3 text-2xl font-bold text-forest-900">
        {prefix}<CountUp end={value} duration={1.2} />
      </p>
      {gradient ? (
        <GradientText colors={["#253b1c", "#4a7c2a", "#16a34a"]} animationSpeed={6} className="mt-0.5 text-sm font-semibold">{label}</GradientText>
      ) : (
        <p className="mt-0.5 text-sm text-forest-900/60">{label}</p>
      )}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get<Stats>("/admin/stats")
      .then(setStats)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Something went wrong.")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const revenueData = (stats?.revenueChart ?? []).map((d) => ({
    month: MONTH[(d._id.month - 1) % 12],
    revenue: d.total,
  }));

  const cityData = (stats?.topCities ?? []).map((d) => ({
    city: d._id,
    count: d.count,
  }));

  const examData = (stats?.examDist ?? [])
    .filter((d) => d._id)
    .map((d) => ({ name: d._id!, value: d.count }));

  const cards = [
    { icon: Building2,   label: "Total Libraries",    value: stats?.totalLibraries ?? 0,    href: "/admin/libraries" },
    { icon: CheckCircle, label: "Verified Libraries",  value: stats?.verifiedLibraries ?? 0, href: "/admin/libraries" },
    { icon: Users,       label: "Total Students",      value: stats?.totalStudents ?? 0,     href: "/admin/students" },
    { icon: BookMarked,  label: "Active Bookings",     value: stats?.activeBookings ?? 0,    href: "/admin/revenue" },
    { icon: TrendingUp,  label: "Platform Revenue",    value: stats?.platformRevenue ?? 0,   prefix: "₹", href: "/admin/revenue", accent: true, gradient: true },
    { icon: CreditCard,  label: "Pending Payouts",     value: stats?.pendingPayouts ?? 0,    href: "/admin/revenue" },
  ];

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.5} threshold={0}>
        <div className="mb-6">
          <ShinyText
            text="Admin Dashboard"
            color="#253b1c"
            shineColor="#4a7c2a"
            speed={4}
            className="font-display text-3xl font-bold sm:text-4xl"
          />
          <p className="mt-1 text-sm text-forest-900/60">
            Platform-wide overview — Scholar&apos;s Hub
          </p>
        </div>
      </AnimatedContent>

      {error ? (
        <DataError message={error} onRetry={load} />
      ) : (
      <>
      {/* 6 Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <AnimatedContent key={card.label} distance={22} duration={0.45} threshold={0} delay={0.04 + i * 0.06}>
            <StatCard {...card} />
          </AnimatedContent>
        ))}
      </div>

      {/* Revenue line chart */}
      <AnimatedContent distance={24} duration={0.5} threshold={0} delay={0.38}>
        <div className="mt-6 rounded-card border border-line bg-white p-5 shadow-soft">
          <p className="mb-4 text-sm font-semibold text-forest-900">Platform Revenue — 12 Months</p>
          {loading || revenueData.length === 0 ? (
            <div className="flex h-44 items-center justify-center text-sm text-forest-900/40">
              {loading ? "Loading chart…" : "No data yet."}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d6e2d3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#253b1c99" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#253b1c99" }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
                <Tooltip
                  formatter={(v) => [`₹${Number(v ?? 0).toLocaleString("en-IN")}`, "Revenue"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid #d6e2d3", fontSize: 12 }}
                />
                <Line dataKey="revenue" stroke="#253b1c" strokeWidth={2} dot={{ r: 3, fill: "#253b1c" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </AnimatedContent>

      {/* Bottom charts row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Top cities bar chart */}
        <AnimatedContent distance={22} duration={0.45} threshold={0} delay={0.42}>
          <div className="rounded-card border border-line bg-white p-5 shadow-soft">
            <p className="mb-4 text-sm font-semibold text-forest-900">Top Cities by Library Count</p>
            {loading || cityData.length === 0 ? (
              <div className="flex h-44 items-center justify-center text-sm text-forest-900/40">
                {loading ? "Loading…" : "No data yet."}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cityData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d6e2d3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#253b1c99" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="city" type="category" tick={{ fontSize: 10, fill: "#253b1c99" }} axisLine={false} tickLine={false} width={72} />
                  <Tooltip
                    formatter={(v) => [v, "Libraries"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #d6e2d3", fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="#4a7c2a" radius={[0, 6, 6, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </AnimatedContent>

        {/* Exam distribution doughnut */}
        <AnimatedContent distance={22} duration={0.45} threshold={0} delay={0.46}>
          <div className="rounded-card border border-line bg-white p-5 shadow-soft">
            <p className="mb-4 text-sm font-semibold text-forest-900">Student Exam Distribution</p>
            {loading || examData.length === 0 ? (
              <div className="flex h-44 items-center justify-center text-sm text-forest-900/40">
                {loading ? "Loading…" : "No data yet."}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={examData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    paddingAngle={3} dataKey="value"
                    label={({ name, percent }) =>
                      `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {examData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend formatter={(v: string) => <span className="text-xs text-forest-900/70">{v}</span>} />
                  <Tooltip
                    formatter={(v) => [v, "Students"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #d6e2d3", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </AnimatedContent>
      </div>
      </>
      )}
    </div>
  );
}
