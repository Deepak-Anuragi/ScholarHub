"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { Check, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { DataError } from "@/components/dashboard/DataError";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { getFacilityIcon } from "@/lib/facility-icons";
import { cn } from "@/lib/utils";

const ALL_FACILITIES = [
  "WiFi","AC","CCTV","Locker","Parking","Generator",
  "Drinking Water","Washroom","Study Material","Power Backup",
];
const ALL_STUDENT_TYPES = ["Govt Exam","Entrance Exam","School","Professional"];

type Photo = { url: string; isCover: boolean; order: number };

type BlockedDate = {
  _id: string;
  start: string;
  end: string;
  type: "HOLIDAY" | "MAINTENANCE";
  note?: string;
};

/** What GET /owner/library/photos/signature returns. */
type UploadSignature = {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
};
type Library = {
  _id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  contactPhone?: string;
  contactEmail?: string;
  whatsapp?: string;
  monthlyFee: number;
  quarterlyFee?: number;
  annualFee?: number;
  openTime?: string;
  closeTime?: string;
  blockedDates: BlockedDate[];
  facilities: string[];
  studentTypes: string[];
  photos: Photo[];
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="rounded-card border border-line bg-white shadow-soft">
      <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-forest-900 select-none">
        {title}
        <span className="text-forest-900/30 text-xs">▼</span>
      </summary>
      <div className="border-t border-line px-5 py-5">{children}</div>
    </details>
  );
}

function Field({
  label,
  name,
  value,
  type = "text",
  onChange,
  disabled,
  required = false,
  error,
}: {
  label: string;
  name: string;
  value: string | number;
  type?: string;
  onChange: (name: string, val: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-forest-900 dark:text-zinc-200">
      <span className="flex items-center gap-1">
        {label}
        {required && <span className="text-red-500 font-bold">*</span>}
      </span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        disabled={disabled}
        className={cn(
          "h-10 rounded-xl border bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700 disabled:opacity-50 dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]",
          error ? "border-red-500 bg-red-50/20" : "border-line"
        )}
      />
      {error && <span className="text-xs text-red-500 font-normal">{error}</span>}
    </label>
  );
}

export default function OwnerLibraryPage() {
  const [lib, setLib] = useState<Library | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<Partial<Library>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bdStart, setBdStart] = useState("");
  const [bdEnd, setBdEnd] = useState("");
  const [bdType, setBdType] = useState<"HOLIDAY" | "MAINTENANCE">("HOLIDAY");
  const [bdNote, setBdNote] = useState("");

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get<{ library: Library | null }>("/owner/library")
      .then((d) => {
        if (d.library) {
          const libData: Library = {
            ...d.library,
            blockedDates: d.library.blockedDates ?? [],
          };
          setLib(libData);
          setForm(libData);
        }
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Something went wrong.")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (name: string, val: string) => {
    setForm((prev) => ({ ...prev, [name]: val }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const toggleArr = (key: "facilities" | "studentTypes", val: string) => {
    setForm((prev) => {
      const arr = (prev[key] as string[]) ?? [];
      return {
        ...prev,
        [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val],
      };
    });
  };

  const handleSave = async () => {
    setError(null);

    // Validate required fields (Req 6.1)
    const errs: Record<string, string> = {};
    const missing: string[] = [];

    if (!form.name?.trim()) {
      errs.name = "Library Name is required";
      missing.push("Library Name");
    }
    if (!form.address?.trim()) {
      errs.address = "Address is required";
      missing.push("Address");
    }
    if (!form.city?.trim()) {
      errs.city = "City is required";
      missing.push("City");
    }
    if (!form.state?.trim()) {
      errs.state = "State is required";
      missing.push("State");
    }
    if (!form.pincode?.trim()) {
      errs.pincode = "Pincode is required";
      missing.push("Pincode");
    }
    if (form.monthlyFee === undefined || Number(form.monthlyFee) <= 0) {
      errs.monthlyFee = "Monthly Fee is required and must be greater than 0";
      missing.push("Monthly Fee");
    }

    if (missing.length > 0) {
      setFieldErrors(errs);
      setError(`Please fill in the required field(s): ${missing.join(", ")}`);
      return;
    }

    setFieldErrors({});
    setSaving(true);
    try {
      const d = await api.patch<{ library?: Library }>("/owner/library", form);
      if (d.library) {
        setLib(d.library);
        setForm(d.library);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlockedDate = async () => {
    if (!bdStart || !bdEnd) return;
    setError(null);
    try {
      const d = await api.post<{ entry?: BlockedDate }>("/owner/library/blocked-dates", {
        start: bdStart,
        end: bdEnd,
        type: bdType,
        note: bdNote || undefined,
      });
      if (d.entry) {
        setLib((prev) =>
          prev
            ? { ...prev, blockedDates: [...prev.blockedDates, d.entry as BlockedDate] }
            : prev
        );
        setForm((prev) => ({
          ...prev,
          blockedDates: prev.blockedDates
            ? [...prev.blockedDates, d.entry as BlockedDate]
            : [d.entry as BlockedDate],
        }));
        setBdStart("");
        setBdEnd("");
        setBdType("HOLIDAY");
        setBdNote("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add blocked date.");
    }
  };

  const handleDeleteBlockedDate = async (id: string) => {
    setError(null);
    try {
      await api.delete(`/owner/library/blocked-dates/${id}`);
      setLib((prev) =>
        prev
          ? { ...prev, blockedDates: prev.blockedDates.filter((b) => b._id !== id) }
          : prev
      );
      setForm((prev) => ({
        ...prev,
        blockedDates: prev.blockedDates?.filter((b) => b._id !== id),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete blocked date.");
    }
  };

  const uploadPhoto = async (file: File, isCover: boolean = false) => {
    setUploading(true);
    setError(null);
    try {
      let url: string | undefined;

      // 1. Try Cloudinary if available
      try {
        const sig = await api.get<UploadSignature>("/owner/library/photos/signature");
        if (sig?.uploadUrl && sig?.apiKey) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("api_key", sig.apiKey);
          fd.append("timestamp", String(sig.timestamp));
          fd.append("folder", sig.folder);
          fd.append("signature", sig.signature);

          const res = await fetch(sig.uploadUrl, { method: "POST", body: fd });
          const data = (await res.json().catch(() => ({}))) as { secure_url?: string };
          if (res.ok && data.secure_url) {
            url = data.secure_url;
          }
        }
      } catch {
        // Cloudinary not configured; fallback cleanly to data URL
      }

      // 2. Reliable data URL fallback so uploads never fail
      if (!url) {
        url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read image file."));
          reader.readAsDataURL(file);
        });
      }

      const res = await api.post<{ success: boolean; photos?: Photo[] }>("/owner/library/photos", {
        url,
        isCover,
      });

      if (res.photos) {
        setLib((prev) => (prev ? { ...prev, photos: res.photos! } : prev));
      } else {
        setLib((prev) =>
          prev
            ? {
                ...prev,
                photos: isCover
                  ? [...prev.photos.map((p) => ({ ...p, isCover: false })), { url: url!, isCover: true, order: prev.photos.length }]
                  : [...prev.photos, { url: url!, isCover: false, order: prev.photos.length }],
              }
            : prev
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload the photo.");
    } finally {
      setUploading(false);
    }
  };

  const onDropCover = useCallback((files: File[]) => {
    if (files[0]) void uploadPhoto(files[0], true);
  }, []);

  const onDropGallery = useCallback((files: File[]) => {
    if (files[0]) void uploadPhoto(files[0], false);
  }, []);

  const coverDropzone = useDropzone({
    onDrop: onDropCover,
    accept: { "image/*": [] },
    maxFiles: 1,
    disabled: uploading,
  });

  const galleryDropzone = useDropzone({
    onDrop: onDropGallery,
    accept: { "image/*": [] },
    maxFiles: 1,
    disabled: uploading,
  });

  const deletePhoto = async (url: string) => {
    setError(null);
    try {
      await api.delete("/owner/library/photos", { body: JSON.stringify({ url }) });
      setLib((prev) =>
        prev ? { ...prev, photos: prev.photos.filter((p) => p.url !== url) } : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the photo.");
    }
  };

  const setCover = async (url: string) => {
    setError(null);
    try {
      await api.patch("/owner/library/photos", { coverUrl: url });
      setLib((prev) =>
        prev
          ? { ...prev, photos: prev.photos.map((p) => ({ ...p, isCover: p.url === url })) }
          : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set the cover photo.");
    }
  };

  if (error && !lib) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <DataError message={error} onRetry={load} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center px-4 py-6">
        <Loader2 className="size-6 animate-spin text-forest-900/40" />
      </div>
    );
  }

  if (!lib) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-card border border-dashed border-line bg-white/60 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-forest-900">
            No library on your account yet
          </p>
          <p className="mt-1 text-sm text-forest-900/50">
            Create one to start listing seats and taking bookings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {error && (
        <div className="mb-4">
          <DataError message={error} />
        </div>
      )}
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
              My Library
            </h1>
            <p className="mt-1 text-sm text-forest-900/60">
              Update your library profile, fees, and photos
            </p>
          </div>
          <Button
            onClick={() => void handleSave()}
            disabled={saving}
            className="bg-forest-700 text-white hover:bg-forest-900"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : saved ? <><Check className="size-4" aria-hidden />Saved!</> : "Save Changes"}
          </Button>
        </div>
      </AnimatedContent>

      <div className="max-w-2xl space-y-4">
        {/* Basic Info */}
        <AnimatedContent distance={20} duration={0.4} threshold={0} delay={0.05}>
          <Section title="Basic Information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Library Name" name="name" value={form.name ?? ""} onChange={set} required error={fieldErrors.name} />
              <Field label="City" name="city" value={form.city ?? ""} onChange={set} required error={fieldErrors.city} />
              <Field label="District" name="district" value={form.district ?? ""} onChange={set} />
              <Field label="State" name="state" value={form.state ?? ""} onChange={set} required error={fieldErrors.state} />
              <Field label="Pincode" name="pincode" value={form.pincode ?? ""} onChange={set} required error={fieldErrors.pincode} />
              <Field label="Contact Phone" name="contactPhone" value={form.contactPhone ?? ""} onChange={set} />
              <Field label="WhatsApp" name="whatsapp" value={form.whatsapp ?? ""} onChange={set} />
              <Field label="Contact Email" name="contactEmail" type="email" value={form.contactEmail ?? ""} onChange={set} />
            </div>
            <label className="mt-4 grid gap-1.5 text-sm font-semibold text-forest-900 dark:text-zinc-200">
              <span className="flex items-center gap-1">
                Full Address <span className="text-red-500 font-bold">*</span>
              </span>
              <textarea
                value={form.address ?? ""}
                onChange={(e) => set("address", e.target.value)}
                rows={2}
                placeholder="Street address, landmark, area..."
                className={cn(
                  "rounded-xl border bg-sage-100/40 px-3 py-2 text-sm text-forest-900 outline-none transition focus:border-forest-700 resize-none dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]",
                  fieldErrors.address ? "border-red-500 bg-red-50/20" : "border-line"
                )}
              />
              {fieldErrors.address && <span className="text-xs text-red-500 font-normal">{fieldErrors.address}</span>}
            </label>
            <label className="mt-4 grid gap-1.5 text-sm font-semibold text-forest-900 dark:text-zinc-200">
              Description
              <textarea
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                placeholder="Describe study hall ambiance, rules, facilities..."
                className="rounded-xl border border-line bg-sage-100/40 px-3 py-2 text-sm text-forest-900 outline-none transition focus:border-forest-700 resize-none dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]"
              />
            </label>
          </Section>
        </AnimatedContent>

        {/* Fees */}
        <AnimatedContent distance={20} duration={0.4} threshold={0} delay={0.08}>
          <Section title="Fee Structure">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Monthly Fee (₹)" name="monthlyFee" type="number" value={form.monthlyFee ?? 0} onChange={set} required error={fieldErrors.monthlyFee} />
              <Field label="Quarterly Fee (₹)" name="quarterlyFee" type="number" value={form.quarterlyFee ?? 0} onChange={set} />
              <Field label="Annual Fee (₹)" name="annualFee" type="number" value={form.annualFee ?? 0} onChange={set} />
            </div>
          </Section>
        </AnimatedContent>

        {/* Timings & Holidays */}
        <AnimatedContent distance={20} duration={0.4} threshold={0} delay={0.095}>
          <Section title="Timings & Holidays">
            <p className="mb-3 text-sm font-semibold text-forest-900">Operating Hours</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Opening Time" name="openTime" type="time" value={form.openTime ?? ""} onChange={set} />
              <Field label="Closing Time" name="closeTime" type="time" value={form.closeTime ?? ""} onChange={set} />
            </div>

            <p className="mt-6 mb-3 text-sm font-semibold text-forest-900">Blocked Dates / Holidays</p>

            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
              <input
                type="date"
                name="bdStart"
                value={bdStart}
                onChange={(e) => setBdStart(e.target.value)}
                className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
                placeholder="Start date"
              />
              <input
                type="date"
                name="bdEnd"
                value={bdEnd}
                onChange={(e) => setBdEnd(e.target.value)}
                className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
                placeholder="End date"
              />
              <select
                name="bdType"
                value={bdType}
                onChange={(e) => setBdType(e.target.value as "HOLIDAY" | "MAINTENANCE")}
                className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
              >
                <option value="HOLIDAY">HOLIDAY</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
              <Button
                size="sm"
                onClick={handleAddBlockedDate}
                className="bg-forest-700 text-white hover:bg-forest-900"
              >
                Add Block
              </Button>
            </div>
            <input
              type="text"
              name="bdNote"
              value={bdNote}
              onChange={(e) => setBdNote(e.target.value)}
              placeholder="Note (optional)"
              className="mt-2 h-10 w-full rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700"
            />

            <div className="mt-4 space-y-2">
              {(lib.blockedDates ?? []).map((entry) => (
                <div
                  key={entry._id}
                  className="rounded-2xl border border-line bg-sage-100/40 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          entry.type === "HOLIDAY"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        )}
                      >
                        {entry.type}
                      </span>
                      <span className="text-sm text-forest-900">
                        {fmtDate(entry.start)} → {fmtDate(entry.end)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteBlockedDate(entry._id)}
                      className="flex size-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                      title="Delete blocked date"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  {entry.note && (
                    <p className="mt-1.5 text-xs text-forest-900/60">{entry.note}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </AnimatedContent>

        {/* Facilities */}
        <AnimatedContent distance={20} duration={0.4} threshold={0} delay={0.11}>
          <Section title="Facilities">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ALL_FACILITIES.map((f) => {
                const Icon = getFacilityIcon(f);
                const checked = (form.facilities ?? []).includes(f);
                return (
                  <label
                    key={f}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-sm transition",
                      checked
                        ? "border-forest-700/40 bg-forest-700/8 text-forest-900"
                        : "border-line text-forest-900/60 hover:border-forest-700/30"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArr("facilities", f)}
                      className="accent-forest-700"
                    />
                    <Icon className="size-3.5 shrink-0 text-forest-700" aria-hidden />
                    {f}
                  </label>
                );
              })}
            </div>
          </Section>
        </AnimatedContent>

        {/* Student Types */}
        <AnimatedContent distance={20} duration={0.4} threshold={0} delay={0.14}>
          <Section title="Student Types">
            <div className="flex flex-wrap gap-2">
              {ALL_STUDENT_TYPES.map((t) => {
                const checked = (form.studentTypes ?? []).includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleArr("studentTypes", t)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                      checked
                        ? "border-forest-700 bg-forest-700 text-white"
                        : "border-line text-forest-900/60 hover:border-forest-700/50"
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </Section>
        </AnimatedContent>

        {/* 1. Cover Image (Home Page & Listing Card) */}
        <AnimatedContent distance={20} duration={0.4} threshold={0} delay={0.16}>
          <Section title="Cover Image (Home & Search Listing)">
            <p className="mb-3 text-xs text-forest-900/60 dark:text-zinc-400">
              This photo is featured on homepage cards, city search results, and map previews.
            </p>
            {(() => {
              const cover = lib.photos.find((p) => p.isCover) ?? lib.photos[0];
              return (
                <div className="space-y-4">
                  {cover ? (
                    <div className="relative overflow-hidden rounded-2xl border border-line bg-sage-100/40">
                      <Image
                        src={cover.url}
                        alt="Library cover photo"
                        width={600}
                        height={300}
                        className="h-48 w-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-forest-700 px-3 py-1 text-xs font-bold text-white shadow-sm">
                        Current Cover Image
                      </span>
                    </div>
                  ) : (
                    <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-line bg-sage-100/20 text-xs text-forest-900/50">
                      No cover photo uploaded yet
                    </div>
                  )}

                  <div
                    {...coverDropzone.getRootProps()}
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition",
                      coverDropzone.isDragActive
                        ? "border-forest-700 bg-forest-700/5"
                        : "border-line hover:border-forest-700/50",
                      uploading && "pointer-events-none opacity-60"
                    )}
                  >
                    <input {...coverDropzone.getInputProps()} />
                    {uploading ? (
                      <Loader2 className="size-6 animate-spin text-forest-900/40" />
                    ) : (
                      <>
                        <ImagePlus className="size-6 text-forest-900/40" />
                        <p className="mt-2 text-xs font-semibold text-forest-900 dark:text-white">
                          {cover ? "Upload New Cover Image" : "Upload Cover Image"}
                        </p>
                        <p className="text-[10px] text-forest-900/50 dark:text-zinc-400">
                          PNG, JPG up to 10MB (recommended 16:9 landscape)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          </Section>
        </AnimatedContent>

        {/* 2. Photo Gallery (Detail Page Images) */}
        <AnimatedContent distance={20} duration={0.4} threshold={0} delay={0.18}>
          <Section title="Photo Gallery (Library Detail Page)">
            <p className="mb-3 text-xs text-forest-900/60 dark:text-zinc-400">
              Upload multiple photos of reading halls, amenities, AC halls, and lockers for the library detail page.
            </p>

            {/* Gallery Upload dropzone */}
            <div
              {...galleryDropzone.getRootProps()}
              className={cn(
                "mb-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition",
                galleryDropzone.isDragActive
                  ? "border-forest-700 bg-forest-700/5"
                  : "border-line hover:border-forest-700/50",
                uploading && "pointer-events-none opacity-60"
              )}
            >
              <input {...galleryDropzone.getInputProps()} />
              {uploading ? (
                <Loader2 className="size-6 animate-spin text-forest-900/40" />
              ) : (
                <>
                  <ImagePlus className="size-6 text-forest-900/40" />
                  <p className="mt-2 text-xs font-semibold text-forest-900 dark:text-white">
                    Add Gallery Photos
                  </p>
                  <p className="text-[10px] text-forest-900/50 dark:text-zinc-400">
                    Drop images here or click to select multiple photos
                  </p>
                </>
              )}
            </div>

            {/* Photo grid */}
            {lib.photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {lib.photos.map((photo) => (
                  <div
                    key={photo.url}
                    className="group relative overflow-hidden rounded-2xl border border-line"
                  >
                    <Image
                      src={photo.url}
                      alt="Library gallery photo"
                      width={320}
                      height={320}
                      className="aspect-square w-full object-cover"
                      loading="lazy"
                    />
                    {photo.isCover && (
                      <span className="absolute left-2 top-2 rounded-full bg-forest-700 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                        Cover
                      </span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-forest-900/60 opacity-0 transition group-hover:opacity-100">
                      {!photo.isCover && (
                        <button
                          type="button"
                          onClick={() => void setCover(photo.url)}
                          className="flex size-8 items-center justify-center rounded-full bg-white text-amber-500 shadow hover:bg-amber-50 transition"
                          title="Set as Cover"
                        >
                          <Star className="size-4 fill-amber-400" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void deletePhoto(photo.url)}
                        className="flex size-8 items-center justify-center rounded-full bg-white text-red-500 shadow hover:bg-red-50 transition"
                        title="Delete photo"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-xs text-forest-900/50 py-4">No gallery photos added yet.</p>
            )}
          </Section>
        </AnimatedContent>
      </div>
    </div>
  );
}
