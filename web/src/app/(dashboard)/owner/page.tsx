"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  BookMarked,
  ArrowRight,
  CalendarDays,
  Star,
  Users,
} from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { CountUp } from "@/components/home/CountUp";
import ShinyText from "@/components/ShinyText/ShinyText";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

type MonthData = { _id: { year: number; month: number }; revenue: number; count?: number };
type BookingRow = {
  _id: string;
  studentId: { name: string; email: string };
  slotId?: { name: string };
  plan: string;
  amountPaid: number;
  status: string;
  createdAt: string;
};
type OwnerStats = {
  library: { name: string; availableSeats: number; totalSeats: number } | null;
  totalStudents: number;
  monthlyRevenue: number;
  pendingReviews: number;
  monthlyChart: MonthData[];
  recentBookings: BookingRow[];
};

function StatCard({
  icon: Icon,
  label,
  value,
  prefix = "",
  href,
  accent = false,
  children,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  prefix?: string;
  href?: string;
  accent?: boolean;
  children?: React.ReactNode;
}) {
  const inner = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-card border border-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift",
        accent && "border-forest-700/20 bg-gradient-to-br from-white to-sage-100/40"
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-2xl",
            accent ? "bg-forest-700/10" : "bg-sage-100"
          )}
        >
          <Icon
            className={cn("size-5", accent ? "text-forest-700" : "text-forest-900/60")}
            aria-hidden
          />
        </div>
        {href && (
          <ArrowRight className="size-4 text-forest-900/20 transition group-hover:text-forest-700" />
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-forest-900">
        {prefix}
        <CountUp end={value} duration={1.2} />
      </p>
      <p className="mt-0.5 text-sm text-forest-900/60">{label}</p>
      {children}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function OwnerOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/owner/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((d: OwnerStats) => setStats(d))
      .finally(() => setLoading(false));
  }, []);

  const chartData = (stats?.monthlyChart ?? []).map((d) => ({
    month: MONTH_NAMES[(d._id.month - 1) % 12],
    revenue: d.revenue,
  }));

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <AnimatedContent distance={20} duration={0.5} threshold={0}>
        <div className="mb-6">
          <h1 className="font-display text-3xl text-forest-900 sm:text-4xl">
            Welcome back, {firstName} 👋
          </h1>
          {stats?.library && (
            <p className="mt-1 text-sm text-forest-900/60">
              Managing{" "}
              <span className="font-semibold text-forest-900">
                {stats.library.name}
              </span>
            </p>
          )}
        </div>
      </AnimatedContent>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Users,
            label: "Active Students",
            value: stats?.totalStudents ?? 0,
            href: "/owner/students",
          },
          {
            icon: CalendarDays,
            label: "Available Seats",
            value: stats?.library?.availableSeats ?? 0,
            href: "/owner/slots",
          },
          {
            icon: BookMarked,
            label: "Revenue This Month",
            value: stats?.monthlyRevenue ?? 0,
            prefix: "₹",
            href: "/owner/revenue",
            accent: true,
          },
          {
            icon: Star,
            label: "Pending Reviews",
            value: stats?.pendingReviews ?? 0,
            href: "/owner/reviews",
          },
        ].map((card, i) => (
          <AnimatedContent
            key={card.label}
            distance={22}
            duration={0.45}
            threshold={0}
            delay={0.05 + i * 0.06}
          >
            <StatCard {...card}>
              {card.label === "Revenue This Month" && (
                <ShinyText
                  text="Revenue This Month"
                  color="#4a7c2a"
                  shineColor="#86efac"
                  speed={3}
                  className="mt-0.5 text-xs font-semibold"
                />
              )}
            </StatCard>
          </AnimatedContent>
        ))}
      </div>

      {/* Revenue chart */}
      <AnimatedContent distance={24} duration={0.5} threshold={0} delay={0.25}>
        <div className="mt-6 rounded-card border border-line bg-white p-5 shadow-soft">
          <p className="mb-4 text-sm font-semibold text-forest-900">
            Revenue — Last 6 Months
          </p>
          {loading || chartData.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-forest-900/40">
              {loading ? "Loading chart…" : "No revenue data yet."}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d6e2d3" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#253b1c99" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#253b1c99" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                  }
                />
                <Tooltip
                  formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #d6e2d3",
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#4a7c2a"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </AnimatedContent>

      {/* Recent bookings */}
      <AnimatedContent distance={20} duration={0.5} threshold={0} delay={0.3}>
        <div className="mt-6 rounded-card border border-line bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <p className="text-sm font-semibold text-forest-900">
              Recent Bookings
            </p>
            <Button asChild variant="ghost" size="sm">
              <Link href="/owner/bookings">
                View all <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-sage-100" />
              ))}
            </div>
          ) : (stats?.recentBookings ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-forest-900/40">
              No bookings yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-forest-900/40">
                    <th className="px-5 py-2.5">Student</th>
                    <th className="px-5 py-2.5">Plan</th>
                    <th className="px-5 py-2.5">Amount</th>
                    <th className="px-5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentBookings.map((b) => (
                    <tr
                      key={b._id}
                      className="border-b border-line last:border-0 hover:bg-sage-100/30"
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium text-forest-900">
                          {b.studentId?.name ?? "—"}
                        </p>
                        <p className="text-xs text-forest-900/50">
                          {b.studentId?.email}
                        </p>
                      </td>
                      <td className="px-5 py-3 capitalize text-forest-900/70">
                        {b.plan.toLowerCase()}
                      </td>
                      <td className="px-5 py-3 font-semibold text-forest-900">
                        ₹{b.amountPaid.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            b.status === "ACTIVE"
                              ? "bg-[#16a34a]/10 text-[#16a34a]"
                              : b.status === "EXPIRED"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-sage-100 text-forest-900/60"
                          )}
                        >
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

      {/* Quick actions */}
      <AnimatedContent distance={20} duration={0.5} threshold={0} delay={0.35}>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "Update Seats", href: "/owner/slots" },
            { label: "View Students", href: "/owner/students" },
            { label: "Add Photos", href: "/owner/library" },
          ].map(({ label, href }) => (
            <Button
              key={label}
              asChild
              variant="outline"
              className="h-auto py-3 flex-col gap-1"
            >
              <Link href={href}>
                <span className="text-xs font-semibold">{label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </AnimatedContent>
    </div>
  );
}
