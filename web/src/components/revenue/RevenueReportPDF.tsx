import React from 'react';
import {
  Document, Page, View, Text, StyleSheet, PDFDownloadLink,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: '#111', fontFamily: 'Helvetica' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#253b1c', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#666', marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#253b1c', marginTop: 20, marginBottom: 10 },
  kpisRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  kpiCard: { flex: 1, backgroundColor: '#f3f8f0', padding: 12, borderRadius: 6, border: '1px solid #d6e2d3' },
  kpiLabel: { fontSize: 9, color: '#666', marginBottom: 4 },
  kpiValue: { fontSize: 16, fontWeight: 'bold', color: '#16a34a' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#e6efe0', border: '1px solid #d6e2d3' },
  tableRow: { flexDirection: 'row', border: '1px solid #d6e2d3', borderTop: 'none' },
  tableCell: { padding: 6, fontSize: 9, flex: 1 },
  tableHeaderCell: { padding: 6, fontSize: 9, fontWeight: 'bold', color: '#253b1c', flex: 1 },
} as const);

const fmtINR = (v: number) => `₹${(v ?? 0).toLocaleString('en-IN')}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN');

function LedgerTable({ ledger }: { ledger: any[] }) {
  return (
    <View>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Date</Text>
        <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Student</Text>
        <Text style={styles.tableHeaderCell}>Plan</Text>
        <Text style={styles.tableHeaderCell}>Total</Text>
        <Text style={styles.tableHeaderCell}>Platform</Text>
        <Text style={styles.tableHeaderCell}>Owner</Text>
        <Text style={styles.tableHeaderCell}>Status</Text>
      </View>
      {ledger.slice(0, 100).map((row: any, i) => {
        const b = row.bookingId || {};
        const stu = b.studentId && typeof b.studentId === 'object' ? `${b.studentId.name ?? ''} <${b.studentId.email ?? ''}>` : String(b.studentId ?? '');
        return (
          <View key={row._id ?? i} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1.2 }]}>{fmtDate(b.createdAt ?? '')}</Text>
            <Text style={[styles.tableCell, { flex: 1.4 }]}>{stu || '—'}</Text>
            <Text style={styles.tableCell}>{(b.plan ?? '').toLowerCase() || '—'}</Text>
            <Text style={styles.tableCell}>{fmtINR(row.totalAmount ?? 0)}</Text>
            <Text style={styles.tableCell}>{fmtINR(row.platformShare ?? 0)}</Text>
            <Text style={styles.tableCell}>{fmtINR(row.ownerShare ?? 0)}</Text>
            <Text style={styles.tableCell}>{row.payoutStatus ?? ''}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function RevenueReportPDF({
  data,
  retention,
  onError,
  onReady,
}: {
  data: any;
  retention: any;
  onError?: (msg: string) => void;
  onReady?: () => void;
}) {
  React.useEffect(() => {
    const t = setTimeout(() => onReady?.(), 100);
    return () => clearTimeout(t);
  }, [onReady]);

  const today = new Date();
  const fname = `revenue-report-${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}.pdf`;
  const myDoc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Scholar'sHub — Revenue Report</Text>
        <Text style={styles.subtitle}>Generated on {today.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</Text>

        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.kpisRow}>
          <View style={styles.kpiCard}><Text style={styles.kpiLabel}>This Month</Text><Text style={styles.kpiValue}>{fmtINR(data?.thisMonth ?? 0)}</Text></View>
          <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Last Month</Text><Text style={styles.kpiValue}>{fmtINR(data?.lastMonth ?? 0)}</Text></View>
          <View style={styles.kpiCard}><Text style={styles.kpiLabel}>All Time</Text><Text style={styles.kpiValue}>{fmtINR(data?.allTime ?? 0)}</Text></View>
          <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Retention</Text><Text style={styles.kpiValue}>{retention?.ratePct ?? 0}%</Text></View>
        </View>

        <Text style={styles.sectionTitle}>Payout Ledger</Text>
        <LedgerTable ledger={data?.ledger ?? []} />
      </Page>
    </Document>
  );

  return (
    <PDFDownloadLink document={myDoc} fileName={fname}>
      {({ blob, url, loading, error }) => {
        if (error) onError?.(String(error));
        if (loading) return null;
        if (url && typeof window !== 'undefined') {
          const a = document.createElement('a');
          a.href = url;
          a.download = fname;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        return null;
      }}
    </PDFDownloadLink>
  );
}
