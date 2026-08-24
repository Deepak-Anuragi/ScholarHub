"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { ImagePlus, Loader2, Star, Trash2, X } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { Button } from "@/components/ui/button";
import { getFacilityIcon } from "@/lib/facility-icons";
import { cn } from "@/lib/utils";

const ALL_FACILITIES = [
  "WiFi","AC","CCTV","Locker","Parking","Generator",
  "Drinking Water","Washroom","Study Material","Power Backup",
];
const ALL_STUDENT_TYPES = ["Govt Exam","Entrance Exam","School","Professional"];

type Photo = { url: string; isCover: boolean; order: number };
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
}: {
  label: string;
  name: string;
  value: string | number;
  type?: string;
  onChange: (name: string, val: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
      {label}
      <input
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        disabled={disabled}
        className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-700 disabled:opacity-50"
      />
    </label>
  );
}

export default function OwnerLibraryPage() {
  const [lib, setLib] = useState<Library | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<Partial<Library>>({});

  useEffect(() => {
    fetch("/api/owner/library", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { library: Library | null }) => {
        if (d.library) {
          setLib(d.library);
          setForm(d.library);
        }
      });
  }, []);

  const set = (name: string, val: string) => {
    setForm((prev) => ({ ...prev, [name]: val }));
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
    setSaving(true);
    const res = await fetch("/api/owner/library", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    const d = (await res.json()) as { library?: Library };
    if (d.library) {
      setLib(d.library);
      setForm(d.library);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Photo upload via Dropzone → Cloudinary (or mock URL in dev)
  const onDrop = useCallback(
    async (files: File[]) => {
      if (!files[0]) return;
      setUploading(true);
      try {
        // If Cloudinary is not configured, use a placeholder URL
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        let url: string;

        if (cloudName) {
          const fd = new FormData();
          fd.append("file", files[0]);
          fd.append("upload_preset", "scholarshub");
          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: "POST", body: fd }
          );
          const data = (await res.json()) as { secure_url: string };
          url = data.secure_url;
        } else {
          // Dev fallback — use a picsum placeholder
          url = `https://picsum.photos/seed/${Date.now()}/800/600`;
        }

        await fetch("/api/owner/library/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ url }),
        });

        setLib((prev) =>
          prev
            ? { ...prev, photos: [...prev.photos, { url, isCover: false, order: prev.photos.length }] }
            : prev
        );
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    disabled: uploading,
  });

  const deletePhoto = async (url: string) => {
    await fetch("/api/owner/library/photos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ url }),
    });
    setLib((prev) =>
      prev ? { ...prev, photos: prev.photos.filter((p) => p.url !== url) } : prev
    );
  };

  const setCover = async (url: string) => {
    await fetch("/api/owner/library/photos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ coverUrl: url }),
    });
    setLib((prev) =>
      prev
        ? { ...prev, photos: prev.photos.map((p) => ({ ...p, isCover: p.url === url })) }
        : prev
    );
  };

  if (!lib) {
    return (
      <div className="flex min-h-64 items-center justify-center px-4 py-6">
        <Loader2 className="size-6 animate-spin text-forest-900/40" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
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
            {saving ? <Loader2 className="size-4 animate-spin" /> : saved ? "✓ Saved!" : "Save Changes"}
          </Button>
        </div>
      </AnimatedContent>

      <div className="max-w-2xl space-y-4">
        {/* Basic Info */}
        <AnimatedContent distance={20} duration={0.4} threshold={0} delay={0.05}>
          <Section title="Basic Information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Library Name" name="name" value={form.name ?? ""} onChange={set} />
              <Field label="City" name="city" value={form.city ?? ""} onChange={set} />
              <Field label="District" name="district" value={form.district ?? ""} onChange={set} />
              <Field label="State" name="state" value={form.state ?? ""} onChange={set} />
              <Field label="Pincode" name="pincode" value={form.pincode ?? ""} onChange={set} />
              <Field label="Contact Phone" name="contactPhone" value={form.contactPhone ?? ""} onChange={set} />
              <Field label="WhatsApp" name="whatsapp" value={form.whatsapp ?? ""} onChange={set} />
              <Field label="Contact Email" name="contactEmail" type="email" value={form.contactEmail ?? ""} onChange={set} />
            </div>
            <label className="mt-4 grid gap-1.5 text-sm font-semibold text-forest-900">
              Address
              <textarea
                value={form.address ?? ""}
                onChange={(e) => set("address", e.target.value)}
                rows={2}
                className="rounded-xl border border-line bg-sage-100/40 px-3 py-2 text-sm text-forest-900 outline-none transition focus:border-forest-700 resize-none"
              />
            </label>
            <label className="mt-4 grid gap-1.5 text-sm font-semibold text-forest-900">
              Description
              <textarea
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                className="rounded-xl border border-line bg-sage-100/40 px-3 py-2 text-sm text-forest-900 outline-none transition focus:border-forest-700 resize-none"
              />
            </label>
          </Section>
        </AnimatedContent>

        {/* Fees */}
        <AnimatedContent distance={20} duration={0.4} threshold={0} delay={0.08}>
          <Section title="Fee Structure">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Monthly (₹)" name="monthlyFee" type="number" value={form.monthlyFee ?? 0} onChange={set} />
              <Field label="Quarterly (₹)" name="quarterlyFee" type="number" value={form.quarterlyFee ?? 0} onChange={set} />
              <Field label="Annual (₹)" name="annualFee" type="number" value={form.annualFee ?? 0} onChange={set} />
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

        {/* Photos */}
        <AnimatedContent distance={20} duration={0.4} threshold={0} delay={0.17}>
          <Section title="Photo Gallery">
            {/* Upload dropzone */}
            <div
              {...getRootProps()}
              className={cn(
                "mb-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition",
                isDragActive
                  ? "border-forest-700 bg-forest-700/5"
                  : "border-line hover:border-forest-700/50",
                uploading && "pointer-events-none opacity-60"
              )}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <Loader2 className="size-6 animate-spin text-forest-900/40" />
              ) : (
                <>
                  <ImagePlus className="size-8 text-forest-900/30" />
                  <p className="mt-2 text-sm text-forest-900/50">
                    Drop an image here or click to upload
                  </p>
                </>
              )}
            </div>

            {/* Photo grid */}
            {lib.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {lib.photos.map((photo) => (
                  <div
                    key={photo.url}
                    className="group relative overflow-hidden rounded-2xl border border-line"
                  >
                    <Image
                      src={photo.url}
                      alt="Library photo"
                      width={320}
                      height={320}
                      className="aspect-square w-full object-cover"
                      loading="lazy"
                    />
                    {photo.isCover && (
                      <span className="absolute left-2 top-2 rounded-full bg-forest-700 px-2 py-0.5 text-[10px] font-bold text-white">
                        Cover
                      </span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-forest-900/50 opacity-0 transition group-hover:opacity-100">
                      {!photo.isCover && (
                        <button
                          type="button"
                          onClick={() => void setCover(photo.url)}
                          className="flex size-8 items-center justify-center rounded-full bg-white text-amber-500"
                          title="Set as cover"
                        >
                          <Star className="size-4 fill-amber-400" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void deletePhoto(photo.url)}
                        className="flex size-8 items-center justify-center rounded-full bg-white text-red-500"
                        title="Delete photo"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </AnimatedContent>
      </div>
    </div>
  );
}
