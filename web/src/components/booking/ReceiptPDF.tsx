"use client";

import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

export interface ReceiptData {
  receiptNumber: string;
  studentName: string;
  studentEmail: string;
  libraryName: string;
  libraryAddress: string;
  plan: string;
  startDate: string;
  endDate: string;
  libraryFee: number;
  platformFee: number;
  amountPaid: number;
  paymentId?: string | null;
}

const styles = StyleSheet.create({
  page:        { fontFamily: "Helvetica", fontSize: 10, padding: 40, color: "#1f2b1b" },
  header:      { marginBottom: 24 },
  brand:       { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#16a34a", marginBottom: 2 },
  subtitle:    { fontSize: 10, color: "#555", marginBottom: 12 },
  divider:     { borderBottom: "1 solid #d6e2d3", marginBottom: 16 },
  receiptNum:  { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  sectionTitle:{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  row:         { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottom: "0.5 solid #eee" },
  label:       { color: "#555" },
  value:       { fontFamily: "Helvetica-Bold", textAlign: "right" },
  totalRow:    { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, marginTop: 4, borderTop: "1.5 solid #16a34a" },
  totalLabel:  { fontFamily: "Helvetica-Bold", fontSize: 12 },
  totalValue:  { fontFamily: "Helvetica-Bold", fontSize: 12, color: "#16a34a" },
  disclaimer:  { marginTop: 30, fontSize: 8, color: "#999", textAlign: "center", borderTop: "0.5 solid #eee", paddingTop: 12 },
});

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtINR(n: number) {
  return `Rs. ${n.toLocaleString("en-IN")}`;
}

export function ReceiptPDF({ data }: { data: ReceiptData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>Scholar&apos;s Hub</Text>
          <Text style={styles.subtitle}>Library Booking Platform — Payment Receipt</Text>
          <View style={styles.divider} />
          <Text style={styles.receiptNum}>Receipt #{data.receiptNumber}</Text>
        </View>

        {/* Student */}
        <Text style={styles.sectionTitle}>Student Details</Text>
        <View style={styles.row}><Text style={styles.label}>Name</Text><Text style={styles.value}>{data.studentName}</Text></View>
        <View style={[styles.row, { marginBottom: 16 }]}><Text style={styles.label}>Email</Text><Text style={styles.value}>{data.studentEmail}</Text></View>

        {/* Library */}
        <Text style={styles.sectionTitle}>Library Details</Text>
        <View style={styles.row}><Text style={styles.label}>Library</Text><Text style={styles.value}>{data.libraryName}</Text></View>
        <View style={[styles.row, { marginBottom: 16 }]}><Text style={styles.label}>Address</Text><Text style={styles.value}>{data.libraryAddress}</Text></View>

        {/* Booking */}
        <Text style={styles.sectionTitle}>Booking Details</Text>
        <View style={styles.row}><Text style={styles.label}>Plan</Text><Text style={styles.value}>{data.plan}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Start Date</Text><Text style={styles.value}>{fmtDate(data.startDate)}</Text></View>
        <View style={[styles.row, { marginBottom: 16 }]}><Text style={styles.label}>End Date</Text><Text style={styles.value}>{fmtDate(data.endDate)}</Text></View>

        {/* Payment */}
        <Text style={styles.sectionTitle}>Payment Breakdown</Text>
        <View style={styles.row}><Text style={styles.label}>Library Fee</Text><Text style={styles.value}>{fmtINR(data.libraryFee)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Platform Fee</Text><Text style={styles.value}>{fmtINR(data.platformFee)}</Text></View>
        {data.paymentId && (
          <View style={styles.row}><Text style={styles.label}>Payment ID</Text><Text style={styles.value}>{data.paymentId}</Text></View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Paid</Text>
          <Text style={styles.totalValue}>{fmtINR(data.amountPaid)}</Text>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          This is a computer-generated receipt and does not require a signature.
        </Text>
      </Page>
    </Document>
  );
}

export async function downloadReceipt(data: ReceiptData, bookingId: string): Promise<void> {
  const blob = await pdf(<ReceiptPDF data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${bookingId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}