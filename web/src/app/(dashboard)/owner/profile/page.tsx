"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, User, Camera, Building2, ShieldCheck, ArrowRight } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

type OwnerProfile = {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  avatarUrl?: string;
  role?: string;
  createdAt?: string;
};

type LibrarySummary = {
  _id: string;
  name: string;
  city: string;
  address: string;
  totalSeats: number;
  availableSeats: number;
  isVerified: boolean;
};

export default function OwnerProfilePage() {
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [library, setLibrary] = useState<LibrarySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    api
      .get<{ profile?: OwnerProfile; library?: LibrarySummary | null }>("/owner/profile")
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          setName(data.profile.name ?? "");
          setPhone(data.profile.phone ?? "");
          setCity(data.profile.city ?? "");
          setState(data.profile.state ?? "");
          setAvatarUrl(data.profile.avatarUrl ?? "");
        }
        if (data.library) {
          setLibrary(data.library);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  const initials = (profile?.name ?? user?.name ?? "O")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await api.patch<{ profile?: OwnerProfile }>("/owner/profile", {
        name,
        phone,
        city,
        state,
        avatarUrl,
      });

      if (res.profile) setProfile(res.profile);
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError((err as Error)?.message || "Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6">
          <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">Owner Profile</h1>
          <p className="mt-1 text-sm text-forest-900/60">
            Manage your personal profile and account credentials
          </p>
        </div>
      </AnimatedContent>

      {loading ? (
        <div className="flex h-52 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-forest-900/40" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Main profile form */}
          <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
            <div className="rounded-card border border-line bg-white p-6 shadow-soft dark:bg-[#18181b] dark:border-[#27272a]">
              {error && (
                <div className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-5">
                {/* Avatar section */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="size-16 ring-2 ring-[#16a34a]/20">
                      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
                      <AvatarFallback className="bg-[#16a34a]/10 text-lg font-bold text-[#16a34a]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="owner-avatar-input"
                      className="absolute -bottom-1 -right-1 flex size-6 cursor-pointer items-center justify-center rounded-full bg-[#16a34a] text-white shadow hover:bg-[#15803d]"
                      title="Upload photo"
                    >
                      <Camera className="size-3" />
                      <input
                        id="owner-avatar-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarFile}
                      />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-forest-900 dark:text-white">Profile Photo</p>
                    <p className="text-xs text-forest-900/50 dark:text-zinc-400">
                      PNG, JPG up to 2MB. Appears across library communications.
                    </p>
                  </div>
                </div>

                {/* Name + Phone */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-semibold text-forest-900 dark:text-white">
                    Full name
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      required
                      className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-900 dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]"
                    />
                  </label>

                  <label className="grid gap-1.5 text-sm font-semibold text-forest-900 dark:text-white">
                    Phone number
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-900 dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]"
                    />
                  </label>
                </div>

                {/* Email (read-only) */}
                <label className="grid gap-1.5 text-sm font-semibold text-forest-900 dark:text-white">
                  Email address
                  <input
                    type="email"
                    value={profile?.email ?? user?.email ?? ""}
                    disabled
                    className="h-10 cursor-not-allowed rounded-xl border border-line bg-sage-100/20 px-3 text-sm text-forest-900/50 dark:bg-[#27272a]/50 dark:text-zinc-500 dark:border-[#3f3f46]"
                  />
                  <span className="text-[11px] text-forest-900/40 dark:text-zinc-500">
                    Email address is tied to your account login and cannot be altered.
                  </span>
                </label>

                {/* City + State */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-semibold text-forest-900 dark:text-white">
                    City
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Bhopal"
                      className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-900 dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]"
                    />
                  </label>

                  <label className="grid gap-1.5 text-sm font-semibold text-forest-900 dark:text-white">
                    State
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-forest-900 dark:bg-[#27272a] dark:text-white dark:border-[#3f3f46]"
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-[#16a34a] text-white hover:bg-[#15803d]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" /> Saving...
                      </>
                    ) : saved ? (
                      <>
                        <Check className="mr-2 size-4" /> Saved!
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </AnimatedContent>

          {/* Side card: Registered Library Info */}
          <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.1}>
            <div className="space-y-4">
              <div className="rounded-card border border-line bg-white p-5 shadow-soft dark:bg-[#18181b] dark:border-[#27272a]">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#16a34a]/10 text-[#16a34a]">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-forest-900 dark:text-white">Your Library</h2>
                    <p className="text-[11px] text-forest-900/50 dark:text-zinc-400">Registered listing</p>
                  </div>
                </div>

                {library ? (
                  <div className="space-y-2 text-xs text-forest-900/70 dark:text-zinc-300">
                    <p className="font-semibold text-forest-900 dark:text-white text-sm">{library.name}</p>
                    <p className="text-forest-900/60 dark:text-zinc-400">{library.address}, {library.city}</p>
                    <div className="flex items-center justify-between border-t border-line pt-2 mt-2 dark:border-[#27272a]">
                      <span>Total Seats:</span>
                      <strong className="text-forest-900 dark:text-white">{library.totalSeats}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Available:</span>
                      <strong className="text-[#16a34a]">{library.availableSeats}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Verification:</span>
                      <span className={`inline-flex items-center gap-1 font-semibold ${library.isVerified ? "text-[#16a34a]" : "text-amber-600"}`}>
                        {library.isVerified ? (
                          <>
                            <ShieldCheck className="size-3.5" /> Verified
                          </>
                        ) : (
                          "Pending Review"
                        )}
                      </span>
                    </div>

                    <Link
                      href="/owner/library"
                      className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-forest-900/5 py-2 text-xs font-semibold text-forest-900 hover:bg-forest-900/10 transition dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                    >
                      Manage Library <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-xs text-forest-900/60 dark:text-zinc-400 mb-3">No library registered yet.</p>
                    <Link
                      href="/owner/library"
                      className="inline-flex items-center gap-1 rounded-xl bg-[#16a34a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#15803d]"
                    >
                      Create Library <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </AnimatedContent>
        </div>
      )}
    </div>
  );
}

