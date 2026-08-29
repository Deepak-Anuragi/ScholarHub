"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, User, Camera, Building2 } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const EXAM_TYPES = [
  "UPSC", "JEE", "NEET", "SSC", "BANKING", "BOARD", "ENTRANCE", "OTHER",
];

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

type Profile = {
  name: string;
  email: string;
  phone: string;
  city?: string;
  state?: string;
  examType?: string;
  targetYear?: number;
  avatarUrl?: string;
  createdAt?: string;
};

type ActiveBooking = {
  _id: string;
  libraryId: { name: string; city: string };
};

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");

  // Form state
  const [name,       setName]       = useState("");
  const [phone,      setPhone]      = useState("");
  const [city,       setCity]       = useState("");
  const [state,      setState]      = useState("");
  const [examType,   setExamType]   = useState("");
  const [targetYear, setTargetYear] = useState("");
  const [avatarUrl,  setAvatarUrl]  = useState("");

  useEffect(() => {
    Promise.all([
      api.get<{ profile?: Profile }>("/student/profile").catch(() => ({ profile: undefined })),
      api.get<{ booking?: ActiveBooking; active?: ActiveBooking[] }>("/student/bookings/active").catch(() => ({ booking: undefined, active: undefined })),
    ])
      .then(([profData, bookingData]) => {
        const p = profData.profile;
        if (p) {
          setProfile(p);
          setName(p.name ?? "");
          setPhone(p.phone ?? "");
          setCity(p.city ?? "");
          setState(p.state ?? "");
          setExamType(p.examType ?? "");
          setTargetYear(p.targetYear ? String(p.targetYear) : "");
          setAvatarUrl(p.avatarUrl ?? "");
        }
        setActiveBooking(bookingData.booking ?? bookingData.active?.[0] ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const initials = (profile?.name ?? user?.name ?? "S")
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

    const body: Record<string, unknown> = { name, phone, city, state, examType, avatarUrl };
    if (targetYear) body.targetYear = Number(targetYear);

    try {
      const res = await api.patch<{ profile?: Profile }>("/student/profile", body);

      if (res.profile) setProfile(res.profile);
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError((err as Error)?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6">
          <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-forest-900/60">
            Update your personal information and preferences
          </p>
        </div>
      </AnimatedContent>

      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
        <div className="max-w-lg">
          {/* Avatar & Header Info */}
          <div className="mb-6 flex items-center gap-4">
            <div className="relative">
              <Avatar size="lg">
                {(avatarUrl || profile?.avatarUrl || user?.avatarUrl) ? (
                  <AvatarImage
                    src={avatarUrl || profile?.avatarUrl || user?.avatarUrl}
                    alt={profile?.name || user?.name || "Avatar"}
                  />
                ) : null}
                <AvatarFallback className="bg-[#16a34a]/15 text-lg font-bold text-[#16a34a]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 flex size-7 cursor-pointer items-center justify-center rounded-full bg-[#16a34a] text-white shadow-md hover:bg-[#15803d]">
                <Camera className="size-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFile}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <p className="font-semibold text-forest-900">
                {profile?.name ?? user?.name ?? "—"}
              </p>
              <p className="text-sm text-forest-900/50">
                {profile?.email ?? user?.email}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex rounded-full bg-sage-100 px-2.5 py-0.5 font-semibold capitalize text-forest-900">
                  {user?.role}
                </span>
                {activeBooking && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#16a34a]/10 px-2.5 py-0.5 font-semibold text-[#16a34a]">
                    <Building2 className="size-3" />
                    {activeBooking.libraryId.name}
                  </span>
                )}
              </div>
              {profile?.createdAt && (
                <p className="mt-1 text-xs text-forest-900/40">
                  Member since{" "}
                  {new Date(profile.createdAt).toLocaleDateString("en-IN", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 rounded-card border border-line bg-white p-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-sage-100" />
              ))}
            </div>
          ) : (
            <form
              onSubmit={(e) => void handleSave(e)}
              className="space-y-4 rounded-card border border-line bg-white p-5 shadow-soft"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
                  Full name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCx}
                    placeholder="Your name"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
                  Phone number
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className={inputCx}
                    placeholder="10-digit number"
                  />
                </label>
              </div>

              <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
                Email address
                <input
                  value={profile?.email ?? user?.email ?? ""}
                  disabled
                  className="h-10 rounded-xl border border-line bg-sage-100/30 px-3 text-sm text-forest-900/50 outline-none"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
                  City
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputCx}
                    placeholder="Your city"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
                  State
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className={inputCx}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
                  Exam type
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className={inputCx}
                  >
                    <option value="">Select exam type</option>
                    {EXAM_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
                  Target year
                  <input
                    value={targetYear}
                    onChange={(e) => setTargetYear(e.target.value)}
                    type="number"
                    min={new Date().getFullYear()}
                    max={new Date().getFullYear() + 10}
                    placeholder={String(new Date().getFullYear() + 1)}
                    className={inputCx}
                  />
                </label>
              </div>

              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-[#16a34a] text-white hover:bg-[#15803d]"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : saved ? (
                  <>
                    <Check className="size-4" aria-hidden />
                    Saved!
                  </>
                ) : (
                  <>
                    <User className="size-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </AnimatedContent>
    </div>
  );
}

const inputCx =
  "h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/20";
