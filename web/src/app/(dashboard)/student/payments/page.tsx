"use client";

import { useEffect, useState } from "react";
import { CreditCard, TrendingUp, Download, FileText, Loader2 } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { CountUp } from "@/components/home/CountUp";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { downloadCSV } from "@/lib/csv";
import { cn } from "@/lib/utils";
import { downloadReceipt, formatPaymentId, type ReceiptData } from "@/components/booking/ReceiptPDF";

type Payment = {
  _id: string;
  libraryId: { name: string; city: string };
  plan: string;
  amountPaid: number;
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  createdAt: string;
  paymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
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
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ payments?: Payment[]; yearlyTotal?: number }>("/student/payments")
      .then((d) => {
        setPayments(d.payments ?? []);
        setYearlyTotal(d.yearlyTotal ?? 0);
      })
      .catch(() => {
        setPayments([]);
        setYearlyTotal(0);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalSpent = payments
    .filter((p) => p.paymentStatus === "SUCCESS")
    .reduce((sum, p) => sum + (p.amountPaid || 0), 0);

  const handleDownloadReceipt = async (p: Payment) => {
    setDownloadingId(p._id);
    try {
      let receiptData: ReceiptData;
      try {
        receiptData = await api.get<ReceiptData>(`/student/bookings/${p._id}/receipt`);
      } catch {
        // Fallback receipt reconstruction if receipt endpoint fails
        receiptData = {
          receiptNumber: "SH-" + p._id.slice(-8).toUpperCase(),
          studentName: "Student",
          studentEmail: "",
          libraryName: p.libraryId?.name ?? "Library",
          libraryAddress: p.libraryId?.city ?? "India",
          libraryImage: (p as unknown as { libraryId?: { photos?: Array<{ url: string; isCover?: boolean }> } }).libraryId?.photos?.find((x) => x.isCover)?.url || null,
          plan: p.plan,
          startDate: p.createdAt,
          endDate: p.createdAt,
          libraryFee: p.amountPaid,
          platformFee: 0,
          amountPaid: p.amountPaid,
          paymentId: formatPaymentId(p.paymentId || p.razorpayPaymentId),
        };
      }

      // Ensure payment ID never displays raw mock format
      receiptData.paymentId = formatPaymentId(receiptData.paymentId || p.paymentId || p.razorpayPaymentId);
      await downloadReceipt(receiptData, p._id);
    } catch (err) {
      console.error("[downloadReceipt error]", err);
      alert("Failed to generate PDF receipt. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
              Payment History
            </h1>
            <p className="mt-1 text-sm text-forest-900/60">
              All transactions for your library bookings
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCSV(
                payments.map((p) => ({
                  Date: fmt(p.createdAt),
                  Library: p.libraryId?.name ?? "—",
                  City: p.libraryId?.city ?? "—",
                  Plan: p.plan,
                  "Amount (₹)": p.amountPaid,
                  Status: p.paymentStatus,
                  "Payment ID": formatPaymentId(p.paymentId || p.razorpayPaymentId),
                })),
                "scholars-hub-payments.csv"
              )
            }
            disabled={payments.length === 0}
            className="shrink-0"
          >
            <Download className="mr-1.5 size-4" />
            Export CSV
          </Button>
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
                    <th className="px-4 py-3">Payment ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Receipt</th>
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
                      <td className="px-4 py-3 font-mono text-xs text-forest-900/70">
                        {formatPaymentId(p.paymentId || p.razorpayPaymentId)}
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
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={downloadingId === p._id}
                          onClick={() => void handleDownloadReceipt(p)}
                          className="h-8 px-2 text-xs text-[#16a34a] hover:bg-[#16a34a]/10"
                        >
                          {downloadingId === p._id ? (
                            <>
                              <Loader2 className="mr-1 size-3.5 animate-spin" />
                              Generating PDF...
                            </>
                          ) : (
                            <>
                              <FileText className="mr-1 size-3.5" />
                              PDF Receipt
                            </>
                          )}
                        </Button>
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
