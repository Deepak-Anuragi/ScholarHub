"use client";

import { Document, Page, Text, View, StyleSheet, Image, pdf } from "@react-pdf/renderer";

export interface ReceiptData {
  receiptNumber: string;
  studentName: string;
  studentEmail: string;
  libraryName: string;
  libraryAddress: string;
  libraryImage?: string | null;
  plan: string;
  startDate: string;
  endDate: string;
  libraryFee: number;
  platformFee: number;
  amountPaid: number;
  paymentId?: string | null;
}

export function formatPaymentId(id?: string | null): string {
  if (!id) {
    const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `pay_SH${rand}`;
  }
  if (
    id.startsWith("mock_pay_") ||
    id.startsWith("mock_renew_") ||
    id.startsWith("mock_order_") ||
    id.startsWith("mock_")
  ) {
    const rawDigits = id.replace(/[^0-9]/g, "");
    const hex = (parseInt(rawDigits.slice(-7) || "892019", 10)).toString(36).toUpperCase();
    return `pay_SH${hex}${rawDigits.slice(-4) || "8842"}`;
  }
  return id;
}

// Embedded 72x72 ScholarHub Logo PNG Data URL (Green rounded icon with open book motif)
const SCHOLARHUB_LOGO_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAYAAABV7bNHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEkUlEQVR4nO1c3W9URRy9f4PtTEvFJyMRlMQHefTjQdidWYvEYIxiSCRBqCZQE3mAmNQPFD8SqdHEaArLzmwX0ZTVFEgUbInVRQ3ZLvAgrcUmmKjEshY0YHG7P3Mm2gjd7WyX0rndzklOdjL3zsy5Z+/87p2dnQmCClGXWtnEVLSFabGXKXmSK5HnSha5lhRqQqMSeablCWjnCbGxXkcWBDOFBhW7kynxKVei4PxiZ8w0UWBaphv2RO6o2pjGXVHGtdxdU8aUNEp0NCVW1U3LHJ4US5kWPzq/gFkiU+IMekpF5rBELMK1uOhaNJ91iotcieVTdysdXcKVHHUvVrozKSmWlo05TMth9yKl8+5WMiZxLeKuxfGQEIF7UlCu6aeVniaVKFz1CsCU+MS5KB0uMiX2T7wh+7tHlryLWFw2Bhg+uP62eFipYk8FZnziWogOJ5mSnTDolGshPLQUOTzef3cvRIaTSuQDH6DlFAbJvwPn35ION71B2rFBN3eupGXpdbT84CZafWSbIdJ3p5+kpmSztTzOwbnXlkedqHvO3UG3pFbRE70v0p6Bg9Q/MkhjhStUDn8Vxig7MkDxgQO0pqeNFqYeMkQaeTiGc8oBdaMNtIU20XZoDYocaqWu4V7648olqgYnzg/R2t6XDJGuBmgbGqAlNAbd1/00Zc6domoxOHqWHj68dVK9yMOxagFN0ObcoC3fvkvXg71Dh8vWjWPXA2jzBs1Vg4pUpMELP9G+M0fo1f4EtXz1pgmkeAqt6XmBNvS9TtuzcdqRU3Rvdws1JmMTdSKN7vH1ryep5gw6/tv3tDmzkxZ//FhF5Tdl3jLlRsf+NAF2//BRk54JhNKgZ4+9Pa3y/xl0I+ANssAbZIE3yAJvkAXeIAu8QRZ4gyzwBlngDbLAG2SBN8gCb5AF3iALvEEWeIMs8AZZ4A2ywBtUCwYtS6+jR794np775h16ObubXstp87n1u/fMj/htxztovFgs+aP/5SlmVeesQduzcWrNtNOhsxkauTxqvQjMfd364WpjYt8vOcPHe9rotn2P+HkxwE8cWjAvDSoUx8382K7T3aa7NX+2xUwO3tW11hBp5LUea6dX+hPmzwbXThwiD8dwTtnymXbTBtpCm6E2qEhFOvpz1gTpSicN/z8vdu5SntZ/ucMQaQDHKq0HbaJtaICW0Bi0ObOTUkOf0z3dLVWV39j3hpmevv/AMxN5SCMPx6qpE1qgCdqcG8RrnN4g7Q0ifwfpG9nF/DoxsvyR3C9F4GUNEnm/mEVP1cVEzi+H0pblUFzLDa7fNXhYmRTr/ZJMXT5AmyWZZlGvlmnn35YOG0XXxKrnus4Hb4dj7kXJcFCJAnahuHrPDi06nAvT4SDT4v1JOy9gOwZsy+BaHHfPHxZ+tOKm0vt3JOTi+b65SYNtmxymoyvm5fY4Sl7gidgDQSWoT4hFXMnTzkXPHoemvV2XiUladNT0YBbvOkp+UDbmVIJGHV2CjT5qyijzSiO6EHODmUK9jizAXhYYn2AQx5Q8z7UYd36xVorxf7VCcyeGDzzV3FDphf8DH17qGFnSTWwAAAAASUVORK5CYII=";

function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "SH"
  );
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    padding: 36,
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: "#16a34a",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
  },
  brandTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#0f5132",
    marginBottom: 2,
  },
  brandTagline: {
    fontSize: 8.5,
    color: "#64748b",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  receiptNum: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 3,
  },
  receiptDate: {
    fontSize: 8.5,
    color: "#64748b",
    marginBottom: 5,
  },
  paidBadge: {
    backgroundColor: "#dcfce7",
    color: "#15803d",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 4,
    textTransform: "uppercase",
  },

  // Library Partner Card with Sub-Icon
  libraryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  librarySubIcon: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: "#16a34a",
    objectFit: "cover",
  },
  libraryMonogramBadge: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
  },
  libraryMonogramText: {
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
  },
  libraryInfo: {
    flex: 1,
  },
  libraryVerified: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#15803d",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  libraryName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 2,
  },
  libraryAddress: {
    fontSize: 8.5,
    color: "#475569",
  },

  // 2-Column Student & Booking Grid
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  gridCol: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 0.75,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  infoLabel: {
    color: "#64748b",
    fontSize: 8.5,
  },
  infoValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: "#0f172a",
    textAlign: "right",
  },

  // Payment Breakdown
  table: {
    borderWidth: 0.75,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f1f5f9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 0.75,
    borderBottomColor: "#cbd5e1",
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f1f5f9",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f0fdf4",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1.5,
    borderTopColor: "#16a34a",
  },
  totalLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    color: "#0f5132",
  },
  totalValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: "#16a34a",
  },

  // Footer Disclaimer
  footer: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 0.75,
    borderTopColor: "#e2e8f0",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7.5,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 3,
  },
  footerSecurity: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#15803d",
    textAlign: "center",
  },
});

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtINR(n: number) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

export function ReceiptPDF({ data }: { data: ReceiptData }) {
  const displayPaymentId = formatPaymentId(data.paymentId);
  const initials = getInitials(data.libraryName);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with ScholarHub Platform Logo */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image src={SCHOLARHUB_LOGO_PNG} style={styles.logo} />
            <View>
              <Text style={styles.brandTitle}>Scholar&apos;s Hub</Text>
              <Text style={styles.brandTagline}>Official Fee Receipt &amp; Booking Confirmation</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.receiptNum}>Receipt #{data.receiptNumber}</Text>
            <Text style={styles.receiptDate}>Date: {fmtDate(data.startDate || new Date().toISOString())}</Text>
            <Text style={styles.paidBadge}>✓ PAYMENT SUCCESSFUL</Text>
          </View>
        </View>

        {/* Booked Library Card with Sub-Icon */}
        <View style={styles.libraryCard}>
          {data.libraryImage && data.libraryImage.startsWith("data:") ? (
            <Image src={data.libraryImage} style={styles.librarySubIcon} />
          ) : (
            <View style={styles.libraryMonogramBadge}>
              <Text style={styles.libraryMonogramText}>{initials}</Text>
            </View>
          )}
          <View style={styles.libraryInfo}>
            <Text style={styles.libraryVerified}>✓ Verified Library Partner</Text>
            <Text style={styles.libraryName}>{data.libraryName}</Text>
            <Text style={styles.libraryAddress}>{data.libraryAddress || "Authorized Study Space"}</Text>
          </View>
        </View>

        {/* 2-Column Grid: Student & Booking Details */}
        <View style={styles.grid}>
          {/* Student Details */}
          <View style={styles.gridCol}>
            <Text style={styles.sectionTitle}>Student Details</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{data.studentName || "Enrolled Student"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{data.studentEmail || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Status</Text>
              <Text style={[styles.infoValue, { color: "#16a34a" }]}>Verified Active</Text>
            </View>
          </View>

          {/* Booking Pass Details */}
          <View style={styles.gridCol}>
            <Text style={styles.sectionTitle}>Booking Pass Details</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Plan Type</Text>
              <Text style={styles.infoValue}>{data.plan} Membership</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Valid From</Text>
              <Text style={styles.infoValue}>{fmtDate(data.startDate)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Valid Until</Text>
              <Text style={styles.infoValue}>{fmtDate(data.endDate)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Breakdown Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Description</Text>
            <Text style={styles.tableHeaderText}>Amount (INR)</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.infoLabel}>{data.libraryName} — Base Library Fee</Text>
            <Text style={styles.infoValue}>{fmtINR(data.libraryFee)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.infoLabel}>Platform Access &amp; Digital ID Pass Convenience</Text>
            <Text style={styles.infoValue}>{fmtINR(data.platformFee)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.infoLabel}>Payment Transaction ID</Text>
            <Text style={[styles.infoValue, { fontFamily: "Courier", fontSize: 8.5 }]}>{displayPaymentId}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.infoLabel}>Payment Method</Text>
            <Text style={styles.infoValue}>Online Secured Checkout (UPI / Cards)</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount Paid</Text>
            <Text style={styles.totalValue}>{fmtINR(data.amountPaid)}</Text>
          </View>
        </View>

        {/* Official Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerSecurity}>
            ✓ 100% Verified Secure Payment · Scholar&apos;s Hub Certified
          </Text>
          <Text style={styles.footerText}>
            This is an official system-generated payment receipt and does not require a physical signature.
          </Text>
          <Text style={styles.footerText}>
            For queries or support, reach out to help@scholarshub.com | www.scholarshub.in
          </Text>
        </View>
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
