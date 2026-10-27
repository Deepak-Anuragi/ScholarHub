"use client";

import { useEffect, useState } from "react";
import { TrendingUp, MapPin, Award, DollarSign } from "lucide-react";
import AnimatedContent from "@/components/AnimatedContent";
import { api } from "@/lib/api";

type AnalyticsData = {
  totalRevenue: number;
  newRegistrations: { week: number; month: number };
  cityStats: Array<{ city: string; count: number }>;
  topLibraries: Array<{ _id: string; name: string; city: string; revenue: number; bookings: number }>;
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AnalyticsData>("/admin/analytics")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-white" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map((i) => <div key={i} className="h-32 animate-pulse rounded-card bg-white" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6">
          <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">Platform Analytics</h1>
          <p className="mt-1 text-sm text-forest-900/60">Overview of platform-wide metrics</p>
        </div>
      </AnimatedContent>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="Total Revenue" value={`₹${data?.totalRevenue?.toLocaleString("en-IN") ?? 0}`} color="green" />
        <StatCard icon={TrendingUp} label="New Users (Week)" value={data?.newRegistrations?.week ?? 0} color="blue" />
        <StatCard icon={TrendingUp} label="New Users (Month)" value={data?.newRegistrations?.month ?? 0} color="purple" />
        <StatCard icon={MapPin} label="Active Cities" value={data?.cityStats?.length ?? 0} color="amber" />
      </div>

      {/* City distribution */}
      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.1}>
        <section className="mt-6 rounded-card border border-line bg-white p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-forest-900">
            <MapPin className="size-4 text-amber-500" />
            City Distribution
          </h2>
          <div className="space-y-3">
            {data?.cityStats?.slice(0, 8).map((c) => {
              const max = Math.max(...(data.cityStats?.map((x) => x.count) ?? [1]));
              const pct = (c.count / max) * 100;
              return (
                <div key={c.city}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-forest-900">{c.city}</span>
                    <span className="text-forest-900/60">{c.count} libraries</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-sage-100">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </AnimatedContent>

      {/* Top libraries */}
      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.15}>
        <section className="mt-6 rounded-card border border-line bg-white p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-forest-900">
            <Award className="size-4 text-[#16a34a]" />
            Top Performing Libraries
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wider text-forest-900/50">
                  <th className="pb-3">Library</th>
                  <th className="pb-3">City</th>
                  <th className="pb-3 text-right">Revenue</th>
                  <th className="pb-3 text-right">Bookings</th>
                </tr>
              </thead>
              <tbody>
                {data?.topLibraries?.map((lib) => (
                  <tr key={lib._id} className="border-b border-line last:border-0">
                    <td className="py-3 font-semibold text-forest-900">{lib.name}</td>
                    <td className="py-3 text-forest-900/60">{lib.city}</td>
                    <td className="py-3 text-right font-bold text-[#16a34a]">₹{lib.revenue.toLocaleString("en-IN")}</td>
                    <td className="py-3 text-right text-forest-900/70">{lib.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </AnimatedContent>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    green: "bg-[#16a34a]/10 text-[#16a34a]",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <AnimatedContent distance={20} duration={0.4} threshold={0} delay={0.05}>
      <div className="rounded-card border border-line bg-white p-5 shadow-soft">
        <div className={`mb-3 flex size-10 items-center justify-center rounded-xl ${colorMap[color] ?? colorMap.green}`}>
          <Icon className="size-5" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-forest-900/50">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold text-forest-900">{value}</p>
      </div>
    </AnimatedContent>
  );
}