"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { DataError } from "@/components/dashboard/DataError";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Slot = {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  totalSeats: number;
  availableSeats: number;
};

type SlotForm = Omit<Slot, "_id">;
const EMPTY: SlotForm = { name: "", startTime: "", endTime: "", totalSeats: 0, availableSeats: 0 };

function SlotModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial?: Slot;
  onSave: (data: SlotForm) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<SlotForm>(
    initial ? { ...initial } : { ...EMPTY }
  );

  const set = (k: keyof SlotForm, v: string) =>
    setForm((p) => ({ ...p, [k]: ["totalSeats", "availableSeats"].includes(k) ? Number(v) : v }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-forest-900/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-card bg-white p-6 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="font-semibold text-forest-900">
            {initial ? "Edit Slot" : "Add Slot"}
          </p>
          <button type="button" onClick={onClose}>
            <X className="size-4 text-forest-900/50" />
          </button>
        </div>
        <div className="space-y-3">
          {(
            [
              { label: "Slot Name (e.g. Morning)", key: "name" as const, type: "text" },
              { label: "Start Time (e.g. 06:00 AM)", key: "startTime" as const, type: "text" },
              { label: "End Time (e.g. 12:00 PM)", key: "endTime" as const, type: "text" },
              { label: "Total Seats", key: "totalSeats" as const, type: "number" },
              { label: "Available Seats", key: "availableSeats" as const, type: "number" },
            ] as { label: string; key: keyof SlotForm; type: string }[]
          ).map(({ label, key, type }) => (
            <label key={key} className="grid gap-1.5 text-sm font-semibold text-forest-900">
              {label}
              <input
                type={type}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm outline-none transition focus:border-forest-700"
              />
            </label>
          ))}
        </div>
        <Button
          onClick={() => onSave(form)}
          disabled={saving || !form.name || !form.startTime || !form.endTime}
          className="mt-5 w-full bg-forest-700 text-white hover:bg-forest-900"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : initial ? "Save Changes" : "Create Slot"}
        </Button>
      </div>
    </div>
  );
}

export default function SlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | Slot | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get<{ slots?: Slot[] }>("/owner/slots")
      .then((d) => setSlots(d.slots ?? []))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Something went wrong.")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (data: SlotForm) => {
    setSaving(true);
    setError(null);
    try {
      if (modal === "add") {
        const d = await api.post<{ slot?: Slot }>("/owner/slots", data);
        if (d.slot) setSlots((p) => [...p, d.slot!]);
      } else if (modal && typeof modal === "object") {
        const d = await api.patch<{ slot?: Slot }>(`/owner/slots/${modal._id}`, data);
        if (d.slot) setSlots((p) => p.map((s) => (s._id === modal._id ? d.slot! : s)));
      }
      setModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the slot.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this slot?")) return;
    setError(null);
    try {
      await api.delete(`/owner/slots/${id}`);
      setSlots((p) => p.filter((s) => s._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the slot.");
    }
  };

  return (
    <>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <AnimatedContent distance={20} duration={0.45} threshold={0}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
                Slot Management
              </h1>
              <p className="mt-1 text-sm text-forest-900/60">
                Manage your library's time shifts and seat counts
              </p>
            </div>
            <Button
              onClick={() => setModal("add")}
              className="bg-forest-700 text-white hover:bg-forest-900"
              size="sm"
            >
              <Plus className="size-4" /> Add Slot
            </Button>
          </div>
        </AnimatedContent>

        <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
          <div className="overflow-hidden rounded-card border border-line bg-white shadow-soft">
            {error ? (
              <DataError message={error} onRetry={load} />
            ) : loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-forest-900/40" />
              </div>
            ) : slots.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-forest-900/40">No slots yet. Add one above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-sage-100/50 text-left text-xs font-semibold uppercase tracking-wide text-forest-900/40">
                      <th className="px-5 py-3">Slot</th>
                      <th className="px-5 py-3">Time</th>
                      <th className="px-5 py-3">Total</th>
                      <th className="px-5 py-3">Available</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((slot) => {
                      const pct = Math.round(
                        (slot.availableSeats / Math.max(slot.totalSeats, 1)) * 100
                      );
                      return (
                        <tr
                          key={slot._id}
                          className="border-b border-line last:border-0 hover:bg-sage-100/20"
                        >
                          <td className="px-5 py-3 font-semibold text-forest-900">
                            {slot.name}
                          </td>
                          <td className="px-5 py-3 text-forest-900/70">
                            {slot.startTime} – {slot.endTime}
                          </td>
                          <td className="px-5 py-3 text-forest-900/70">
                            {slot.totalSeats}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "font-semibold",
                                  slot.availableSeats === 0
                                    ? "text-red-500"
                                    : slot.availableSeats <= 5
                                    ? "text-amber-600"
                                    : "text-[#16a34a]"
                                )}
                              >
                                {slot.availableSeats}
                              </span>
                              <div className="w-16 h-1.5 rounded-full bg-sage-100">
                                <div
                                  className="h-1.5 rounded-full bg-forest-700"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setModal(slot)}
                                className="flex size-7 items-center justify-center rounded-lg text-forest-900/50 transition hover:bg-sage-100 hover:text-forest-900"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDelete(slot._id)}
                                className="flex size-7 items-center justify-center rounded-lg text-forest-900/50 transition hover:bg-red-50 hover:text-red-500"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </AnimatedContent>
      </div>

      {modal && (
        <SlotModal
          initial={modal === "add" ? undefined : modal}
          onSave={(data) => void handleSave(data)}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
    </>
  );
}
