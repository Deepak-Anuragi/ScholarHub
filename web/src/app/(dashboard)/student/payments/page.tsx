"use client";

import { useEffect, useState } from "react";
import { CreditCard, TrendingUp } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { CountUp } from "@/components/home/CountUp";
import { cn } from "@/lib/utils";

type Payment = {
  _id: string;
  libraryId: { name: string; city: string };
  plan: string;
  amountPaid: number;
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  createdAt: string;
  paymentId?: string;
};

const STATUS_STYLES: Record<string, string> = {
  SUCCESS: "bg-[#16a34a]/10 text-[#16a34a]",
  PENDING: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-600",
  REFUNDED: "bg-blue-100 text-blue-700",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [yearlyTotal, setYearlyTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/payments", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { payments?: Payment[]; yearlyTotal?: number }) => {
        setPayments(d.payments ?? []);
        setYearlyTotal(d.yearlyTotal ?? 0);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalSpent = payments
    .filter((p) => p.paymentStatus === "SUCCESS")
    .reduce((sum, p) => sum + p.amountPaid, 0);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6">
          <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
            Payment History
          </h1>
          <p className="mt-1 text-sm text-forest-900/60">
            All transactions for your library bookings
          </p>
        </div>
      </AnimatedContent>

      {/* Summary cards */}
      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-card border border-line bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2 text-sm text-forest-900/60">
              <CreditCard className="size-4 text-[#16a34a]" />
              Total Spent (All Time)
            </div>
            <p className="mt-2 text-3xl font-bold text-forest-900">
              ₹<CountUp end={totalSpent} duration={1.2} />
            </p>
          </div>
          <div className="rounded-card border border-line bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2 text-sm text-forest-900/60">
              <TrendingUp className="size-4 text-[#16a34a]" />
              Spent This Year
            </div>
            <p className="mt-2 text-3xl font-bold text-forest-900">
              ₹<CountUp end={yearlyTotal} duration={1.2} />
            </p>
          </div>
        </div>
      </AnimatedContent>

      {/* Table */}
      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.1}>
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-soft">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-sage-100" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="py-12 text-center text-sm text-forest-900/50">
              No payment records yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-sage-100/60 text-left text-xs font-semibold uppercase tracking-wide text-forest-900/50">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Library</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr
                      key={p._id}
                      className="border-b border-line last:border-0 hover:bg-sage-100/30"
                    >
                      <td className="px-4 py-3 text-forest-900/70">
                        {fmt(p.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-forest-900">
                          {p.libraryId?.name ?? "—"}
                        </p>
                        <p className="text-xs text-forest-900/50">
                          {p.libraryId?.city}
                        </p>
                      </td>
                      <td className="px-4 py-3 capitalize text-forest-900/70">
                        {p.plan.toLowerCase()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-forest-900">
                        ₹{p.amountPaid.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            STATUS_STYLES[p.paymentStatus] ??
                              "bg-sage-100 text-forest-900"
                          )}
                        >
                          {p.paymentStatus}
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
