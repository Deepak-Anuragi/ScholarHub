"use client";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import AnimatedContent from "@/components/AnimatedContent";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Dispute = { _id: string; subject: string; status: string; description: string; resolution?: string; createdAt: string; libraryId: { name: string } };

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-50 text-amber-700", under_review: "bg-blue-50 text-blue-700",
  resolved: "bg-[#16a34a]/10 text-[#16a34a]", rejected: "bg-red-50 text-red-600",
};

export default function StudentDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ libraryId: "", subject: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.get<{ disputes: Dispute[] }>("/student/disputes").then((d) => setDisputes(d.disputes ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const d = await api.post<{ dispute: Dispute }>("/student/disputes", form);
      setDisputes((prev) => [d.dispute, ...prev]);
      setForm({ libraryId: "", subject: "", description: "" });
      setShowForm(false);
    } catch { /**/ } finally { setSubmitting(false); }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">Disputes</h1>
            <p className="mt-1 text-sm text-forest-900/60">Raise an issue with a library or booking</p>
          </div>
          <Button onClick={() => setShowForm((v) => !v)} className="bg-[#16a34a] text-white hover:bg-[#15803d]">
            {showForm ? "Cancel" : "Raise Dispute"}
          </Button>
        </div>
      </AnimatedContent>
      {showForm && (
        <form onSubmit={(e) => void handleSubmit(e)} className="mb-6 rounded-card border border-line bg-white p-5 shadow-soft">
          <div className="grid gap-3">
            <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
              Library ID
              <input required value={form.libraryId} onChange={(e) => setForm((f) => ({ ...f, libraryId: e.target.value }))} placeholder="Library ID from your booking"
                className="h-10 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-[#16a34a]" />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
              Subject
              <input required value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Brief summary of the issue"
                className="h-10 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-[#16a34a]" />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
              Description
              <textarea required value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} placeholder="Describe the issue in detail..."
                className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-[#16a34a]" />
            </label>
            <Button type="submit" disabled={submitting} className="bg-[#16a34a] text-white hover:bg-[#15803d]">
              {submitting ? "Submitting..." : "Submit Dispute"}
            </Button>
          </div>
        </form>
      )}
      {loading ? (
        <div className="space-y-3">{[1,2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />)}</div>
      ) : disputes.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-white/60 py-16 text-center">
          <AlertCircle className="mx-auto size-8 text-forest-900/30" />
          <p className="mt-3 text-sm text-forest-900/50">No disputes raised yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <div key={d._id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-forest-900">{d.subject}</p>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLES[d.status] ?? "bg-sage-100 text-forest-900")}>
                      {d.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-forest-900/60">{d.libraryId?.name}</p>
                </div>
                <p className="text-xs text-forest-900/40">{new Date(d.createdAt).toLocaleDateString("en-IN")}</p>
              </div>
              {d.resolution && (
                <div className="mt-3 rounded-xl bg-[#16a34a]/5 px-3 py-2 text-xs text-forest-900/70">
                  <span className="font-semibold text-[#16a34a]">Resolution: </span>{d.resolution}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
