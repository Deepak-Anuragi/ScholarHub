"use client";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import AnimatedContent from "@/components/AnimatedContent";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Dispute = {
  _id: string;
  studentId: { name: string; email: string };
  libraryId: { name: string; city: string };
  subject: string;
  description: string;
  status: "open" | "under_review" | "resolved" | "rejected";
  resolution?: string;
  refundAmount?: number;
  createdAt: string;
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-50 text-amber-700",
  under_review: "bg-blue-50 text-blue-700",
  resolved: "bg-[#16a34a]/10 text-[#16a34a]",
  rejected: "bg-red-50 text-red-600",
};
const STATUS_ICONS: Record<string, React.ElementType> = {
  open: Clock, under_review: AlertCircle, resolved: CheckCircle, rejected: XCircle,
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [form, setForm] = useState({ status: "", resolution: "", refundAmount: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get<{ disputes: Dispute[] }>("/admin/disputes")
      .then((d) => setDisputes(d.disputes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openDispute = (d: Dispute) => {
    setSelected(d);
    setForm({ status: d.status, resolution: d.resolution ?? "", refundAmount: d.refundAmount?.toString() ?? "" });
  };

  const handleResolve = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.patch(/admin/disputes/, {
        status: form.status,
        resolution: form.resolution,
        ...(form.refundAmount ? { refundAmount: Number(form.refundAmount) } : {}),
      });
      setSelected(null);
      load();
    } catch { /* err */ } finally { setSaving(false); }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6">
          <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">Disputes</h1>
          <p className="mt-1 text-sm text-forest-900/60">{disputes.length} total</p>
        </div>
      </AnimatedContent>
      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />)}</div>
      ) : disputes.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-white/60 py-16 text-center">
          <p className="text-sm text-forest-900/50">No disputes found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => {
            const Icon = STATUS_ICONS[d.status] ?? Clock;
            return (
              <div key={d._id} className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-white p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-forest-900">{d.subject}</p>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLES[d.status])}>
                      <Icon className="size-3" />{d.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-forest-900/60">{d.studentId.name} - {d.libraryId.name}, {d.libraryId.city}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => openDispute(d)}>View</Button>
              </div>
            );
          })}
        </div>
      )}
      {selected && (
        <Modal open onOpenChange={(v) => { if (!v) setSelected(null); }} title={selected.subject}>
          <div className="space-y-4">
            <div className="rounded-2xl bg-sage-100/40 p-4 text-sm text-forest-900/70">{selected.description}</div>
            <div className="grid gap-3">
              <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
                Status
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="h-10 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-[#16a34a]">
                  {["open","under_review","resolved","rejected"].map((s) => (
                    <option key={s} value={s}>{s.replace("_"," ")}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
                Resolution
                <textarea value={form.resolution} onChange={(e) => setForm((f) => ({ ...f, resolution: e.target.value }))}
                  rows={3} className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-[#16a34a]" />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
                Refund amount (Rs.)
                <input type="number" value={form.refundAmount} onChange={(e) => setForm((f) => ({ ...f, refundAmount: e.target.value }))}
                  className="h-10 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-[#16a34a]" placeholder="0" />
              </label>
            </div>
            <Button onClick={() => void handleResolve()} disabled={saving} className="w-full bg-[#16a34a] text-white hover:bg-[#15803d]">
              {saving ? "Saving..." : "Update Dispute"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
