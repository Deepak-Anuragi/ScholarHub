"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, Clock, AlertCircle } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { DataError } from "@/components/dashboard/DataError";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Slot = {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  totalSeats: number;
  availableSeats: number;
  monthlyFee?: number;
  quarterlyFee?: number;
  annualFee?: number;
};

type SlotForm = Omit<Slot, "_id">;
const EMPTY: SlotForm = {
  name: "Morning Batch",
  startTime: "06:00 AM",
  endTime: "12:00 PM",
  totalSeats: 0,
  availableSeats: 0,
  monthlyFee: 0,
  quarterlyFee: 0,
  annualFee: 0,
};

const SLOT_PRESETS = [
  { label: "Morning Batch", start: "06:00 AM", end: "12:00 PM" },
  { label: "Afternoon Batch", start: "12:00 PM", end: "05:00 PM" },
  { label: "Evening Batch", start: "05:00 PM", end: "10:00 PM" },
  { label: "Night Batch", start: "10:00 PM", end: "06:00 AM" },
  { label: "Full Day", start: "06:00 AM", end: "11:00 PM" },
  { label: "Enter a custom slot name", start: "", end: "" },
];

function TimeClockPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (val: string) => void;
  label: string;
}) {
  const parseTime = (str: string) => {
    const match = str?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return { hour: "06", minute: "00", period: "AM" };
    let h = match[1].padStart(2, "0");
    const m = match[2];
    let p = (match[3] ?? "AM").toUpperCase();
    if (parseInt(h) > 12) {
      h = String(parseInt(h) - 12).padStart(2, "0");
      p = "PM";
    }
    return { hour: h, minute: m, period: p };
  };

  const parsed = parseTime(value);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState(parsed.period);

  useEffect(() => {
    const p = parseTime(value);
    setHour(p.hour);
    setMinute(p.minute);
    setPeriod(p.period);
  }, [value]);

  const update = (newH: string, newM: string, newP: string) => {
    setHour(newH);
    setMinute(newM);
    setPeriod(newP);
    onChange(`${newH}:${newM} ${newP}`);
  };

  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-semibold text-forest-900 dark:text-zinc-200">{label}</span>
      <div className="flex items-center gap-1.5">
        {/* Hour selector */}
        <select
          value={hour}
          onChange={(e) => update(e.target.value, minute, period)}
          className="h-10 w-16 rounded-xl border border-line bg-sage-100/40 px-2 text-center text-sm font-semibold text-forest-900 outline-none transition focus:border-forest-700 dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]"
        >
          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="font-bold text-forest-900/60">:</span>
        {/* Minute selector */}
        <select
          value={minute}
          onChange={(e) => update(hour, e.target.value, period)}
          className="h-10 w-16 rounded-xl border border-line bg-sage-100/40 px-2 text-center text-sm font-semibold text-forest-900 outline-none transition focus:border-forest-700 dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]"
        >
          {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        {/* AM/PM selector */}
        <div className="flex h-10 rounded-xl border border-line p-0.5 bg-sage-100/40 dark:bg-[#27272a] dark:border-[#3f3f46]">
          <button
            type="button"
            onClick={() => update(hour, minute, "AM")}
            className={cn(
              "px-2.5 rounded-lg text-xs font-bold transition",
              period === "AM"
                ? "bg-[#16a34a] text-white shadow-sm"
                : "text-forest-900/60 hover:text-forest-900 dark:text-zinc-400"
            )}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => update(hour, minute, "PM")}
            className={cn(
              "px-2.5 rounded-lg text-xs font-bold transition",
              period === "PM"
                ? "bg-[#16a34a] text-white shadow-sm"
                : "text-forest-900/60 hover:text-forest-900 dark:text-zinc-400"
            )}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const isEditing = initial !== undefined;
  const initialIsPreset = SLOT_PRESETS.some((p) => p.label === initial?.name);
  const [selectedPreset, setSelectedPreset] = useState<string>(
    isEditing
      ? initialIsPreset
        ? initial.name
        : "Enter a custom slot name"
      : "Morning Batch"
  );
  const [customName, setCustomName] = useState<string>(
    isEditing && !initialIsPreset ? initial.name : ""
  );

  const [form, setForm] = useState<SlotForm>(
    initial
      ? { ...initial }
      : {
          ...EMPTY,
          name: "Morning Batch",
          startTime: "06:00 AM",
          endTime: "12:00 PM",
        }
  );

  const [error, setError] = useState<string | null>(null);

  const handlePresetChange = (presetLabel: string) => {
    setSelectedPreset(presetLabel);
    if (presetLabel === "Enter a custom slot name") {
      setForm((p) => ({ ...p, name: customName }));
    } else {
      const found = SLOT_PRESETS.find((p) => p.label === presetLabel);
      if (found) {
        setForm((p) => ({
          ...p,
          name: found.label,
          startTime: found.start || p.startTime,
          endTime: found.end || p.endTime,
        }));
      }
    }
  };

  const handleCustomNameChange = (val: string) => {
    setCustomName(val);
    setForm((p) => ({ ...p, name: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const slotName =
      selectedPreset === "Enter a custom slot name" ? customName.trim() : selectedPreset.trim();

    if (!slotName) {
      setError("Please select or enter a slot name.");
      return;
    }
    if (!form.startTime || !form.endTime) {
      setError("Please set both Start Time and End Time.");
      return;
    }
    if (form.totalSeats < 0 || form.availableSeats < 0) {
      setError("Total seats and available seats cannot be negative (minimum is 0).");
      return;
    }
    if (form.availableSeats > form.totalSeats) {
      setError(`Available seats (${form.availableSeats}) cannot exceed total seats (${form.totalSeats}).`);
      return;
    }

    onSave({
      ...form,
      name: slotName,
      totalSeats: Math.max(0, form.totalSeats),
      availableSeats: Math.max(0, form.availableSeats),
    });
  };

  return (
    <Modal
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={initial ? "Edit Shift / Slot" : "Add Shift / Slot"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Slot Name preset dropdown (Req 6.2) */}
        <div className="grid gap-1.5">
          <label className="text-xs font-semibold text-forest-900 dark:text-zinc-200">
            Slot Name <span className="text-red-500 font-bold">*</span>
          </label>
          <select
            value={selectedPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm font-medium text-forest-900 outline-none transition focus:border-forest-700 dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]"
          >
            {SLOT_PRESETS.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {selectedPreset === "Enter a custom slot name" && (
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold text-forest-900 dark:text-zinc-200">
              Custom Slot Name <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              type="text"
              value={customName}
              placeholder="e.g. Early Bird Shift, 24/7 Unlimited"
              onChange={(e) => handleCustomNameChange(e.target.value)}
              className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700 dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]"
            />
          </div>
        )}

        {/* 2. Standard interactive time clock selector for Start and End Time (Req 6.3) */}
        <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border border-line bg-sage-100/20 p-3.5 dark:bg-[#27272a]/40 dark:border-[#3f3f46]">
          <TimeClockPicker
            label="Start Time"
            value={form.startTime}
            onChange={(val) => setForm((p) => ({ ...p, startTime: val }))}
          />
          <TimeClockPicker
            label="End Time"
            value={form.endTime}
            onChange={(val) => setForm((p) => ({ ...p, endTime: val }))}
          />
        </div>

        {/* 3. Non-negative seat counts (Req 6.4) */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-semibold text-forest-900 dark:text-zinc-200">
            Total Seats (Min: 0) <span className="text-red-500 font-bold">*</span>
            <input
              type="number"
              min={0}
              value={form.totalSeats}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value) || 0);
                setForm((p) => ({
                  ...p,
                  totalSeats: val,
                  // Auto-adjust availableSeats if it exceeds totalSeats
                  availableSeats: Math.min(val, p.availableSeats),
                }));
              }}
              className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700 dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]"
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-forest-900 dark:text-zinc-200">
            Available Seats (Min: 0) <span className="text-red-500 font-bold">*</span>
            <input
              type="number"
              min={0}
              max={form.totalSeats}
              value={form.availableSeats}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value) || 0);
                setForm((p) => ({ ...p, availableSeats: val }));
              }}
              className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700 dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]"
            />
          </label>
        </div>

        {/* 4. Slot Fees */}
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1.5 text-xs font-semibold text-forest-900 dark:text-zinc-200">
            Monthly Fee (₹)
            <input
              type="number"
              min={0}
              value={form.monthlyFee ?? 0}
              onChange={(e) =>
                setForm((p) => ({ ...p, monthlyFee: Math.max(0, parseInt(e.target.value) || 0) }))
              }
              className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700 dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-forest-900 dark:text-zinc-200">
            Quarterly Fee (₹)
            <input
              type="number"
              min={0}
              value={form.quarterlyFee ?? 0}
              onChange={(e) =>
                setForm((p) => ({ ...p, quarterlyFee: Math.max(0, parseInt(e.target.value) || 0) }))
              }
              className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700 dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-forest-900 dark:text-zinc-200">
            Annual Fee (₹)
            <input
              type="number"
              min={0}
              value={form.annualFee ?? 0}
              onChange={(e) =>
                setForm((p) => ({ ...p, annualFee: Math.max(0, parseInt(e.target.value) || 0) }))
              }
              className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700 dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]"
            />
          </label>
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="mt-5 w-full bg-[#16a34a] text-white hover:bg-[#15803d]"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : initial ? (
            "Save Changes"
          ) : (
            "Create Slot"
          )}
        </Button>
      </form>
    </Modal>
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
                      <th className="px-5 py-3">Monthly (₹)</th>
                      <th className="px-5 py-3">Quarterly (₹)</th>
                      <th className="px-5 py-3">Annual (₹)</th>
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
                          <td className="px-5 py-3 text-forest-900/70">
                            {slot.monthlyFee ?? "—"}
                          </td>
                          <td className="px-5 py-3 text-forest-900/70">
                            {slot.quarterlyFee ?? "—"}
                          </td>
                          <td className="px-5 py-3 text-forest-900/70">
                            {slot.annualFee ?? "—"}
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
