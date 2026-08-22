"use client";

import { useEffect, useState } from "react";
import { CreditCard, TrendingUp, Download, FileText } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { CountUp } from "@/components/home/CountUp";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { downloadCSV } from "@/lib/csv";
import { cn } from "@/lib/utils";

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

  const downloadReceipt = async (p: Payment) => {
    try {
      const { pdf, Document, Page, Text, View, StyleSheet } = await import("@react-pdf/renderer");
      
      const styles = StyleSheet.create({
        page: { padding: 36, fontFamily: "Helvetica", backgroundColor: "#ffffff" },
        header: { marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
        title: { fontSize: 20, fontWeight: "bold", color: "#16a34a" },
        subtitle: { fontSize: 10, color: "#6b7280", marginTop: 4 },
        row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 6 },
        label: { fontSize: 11, color: "#4b5563" },
        value: { fontSize: 11, fontWeight: "bold", color: "#111827" },
        divider: { marginVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
        totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, paddingTop: 10, borderTopWidth: 2, borderTopColor: "#16a34a" },
        totalLabel: { fontSize: 13, fontWeight: "bold", color: "#111827" },
        totalValue: { fontSize: 15, fontWeight: "bold", color: "#16a34a" },
        footer: { marginTop: 30, textAlign: "center", fontSize: 9, color: "#9ca3af" }
      });

      const ReceiptDocument = (
        <Document>
          <Page size="A6" style={styles.page}>
            <View style={styles.header}>
              <Text style={styles.title}>Scholar's Hub</Text>
              <Text style={styles.subtitle}>Payment Receipt & Tax Invoice</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Receipt ID:</Text>
              <Text style={styles.value}>#{p._id.slice(-8).toUpperCase()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Transaction Date:</Text>
              <Text style={styles.value}>{fmt(p.createdAt)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Payment Ref:</Text>
              <Text style={styles.value}>{p.paymentId || p.razorpayPaymentId || "N/A"}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.label}>Library Name:</Text>
              <Text style={styles.value}>{p.libraryId?.name || "Library"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>City:</Text>
              <Text style={styles.value}>{p.libraryId?.city || "N/A"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Plan Selected:</Text>
              <Text style={styles.value}>{p.plan}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Amount Paid:</Text>
              <Text style={styles.totalValue}>₹{p.amountPaid.toLocaleString("en-IN")}</Text>
            </View>
            <Text style={styles.footer}>Thank you for choosing Scholar's Hub!</Text>
          </Page>
        </Document>
      );

      const blob = await pdf(ReceiptDocument).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${p._id.slice(-6)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback text receipt download if PDF renderer fails
      const content = `Scholar's Hub Payment Receipt\n\nReceipt ID: #${p._id}\nDate: ${fmt(p.createdAt)}\nLibrary: ${p.libraryId?.name ?? "N/A"}\nPlan: ${p.plan}\nAmount Paid: ₹${p.amountPaid}\nPayment ID: ${p.paymentId ?? p.razorpayPaymentId ?? "N/A"}\nStatus: ${p.paymentStatus}`;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${p._id.slice(-6)}.txt`;
      link.click();
      URL.revokeObjectURL(url);
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
                  "Payment ID": p.paymentId ?? p.razorpayPaymentId ?? "—",
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
                      <td className="px-4 py-3 font-mono text-xs text-forest-900/60">
                        {p.paymentId || p.razorpayPaymentId || `#${p._id.slice(-6)}`}
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
                          onClick={() => void downloadReceipt(p)}
                          className="h-8 px-2 text-xs text-[#16a34a] hover:bg-[#16a34a]/10"
                        >
                          <FileText className="mr-1 size-3.5" />
                          Receipt
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
