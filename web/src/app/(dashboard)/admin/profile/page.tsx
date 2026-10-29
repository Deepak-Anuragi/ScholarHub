"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Camera, ShieldCheck, Key, ShieldAlert } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type AdminProfile = {
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role?: string;
  createdAt?: string;
};

export default function AdminProfilePage() {
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    api
      .get<{ profile?: AdminProfile }>("/admin/profile")
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          setName(data.profile.name ?? "");
          setPhone(data.profile.phone ?? "");
          setAvatarUrl(data.profile.avatarUrl ?? "");
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  const initials = (profile?.name ?? user?.name ?? "A")
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
      const res = await api.patch<{ profile?: AdminProfile }>("/admin/profile", {
        name,
        phone,
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
          <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">Administrator Profile</h1>
          <p className="mt-1 text-sm text-forest-900/60">
            Manage your administrative account details and credentials
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
                    <Avatar className="size-16 ring-2 ring-forest-900/20">
                      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
                      <AvatarFallback className="bg-forest-900/10 text-lg font-bold text-forest-900">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="admin-avatar-input"
                      className="absolute -bottom-1 -right-1 flex size-6 cursor-pointer items-center justify-center rounded-full bg-forest-900 text-white shadow hover:bg-forest-700"
                      title="Upload photo"
                    >
                      <Camera className="size-3" />
                      <input
                        id="admin-avatar-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarFile}
                      />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-forest-900 dark:text-white">Admin Avatar</p>
                    <p className="text-xs text-forest-900/50 dark:text-zinc-400">
                      Displayed on administrative logs, dispute resolutions, and platform notices.
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
                      placeholder="Platform Admin"
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
                  Admin Email
                  <input
                    type="email"
                    value={profile?.email ?? user?.email ?? ""}
                    disabled
                    className="h-10 cursor-not-allowed rounded-xl border border-line bg-sage-100/20 px-3 text-sm text-forest-900/50 dark:bg-[#27272a]/50 dark:text-zinc-500 dark:border-[#3f3f46]"
                  />
                  <span className="text-[11px] text-forest-900/40 dark:text-zinc-500">
                    Your primary administrator email address.
                  </span>
                </label>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-forest-900 text-white hover:bg-forest-700"
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

          {/* Side card: Privilege & Security Info */}
          <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.1}>
            <div className="space-y-4">
              <div className="rounded-card border border-line bg-white p-5 shadow-soft dark:bg-[#18181b] dark:border-[#27272a]">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-forest-900/10 text-forest-900">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-forest-900 dark:text-white">Admin Privileges</h2>
                    <p className="text-[11px] text-forest-900/50 dark:text-zinc-400">Full System Control</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-forest-900/70 dark:text-zinc-300">
                  <div className="flex items-center justify-between border-b border-line pb-2 dark:border-[#27272a]">
                    <span>Role:</span>
                    <strong className="rounded-full bg-forest-900/10 px-2 py-0.5 text-[11px] font-bold text-forest-900">
                      SUPER ADMIN
                    </strong>
                  </div>
                  <div className="flex items-center justify-between border-b border-line pb-2 dark:border-[#27272a]">
                    <span>Course Management:</span>
                    <strong className="text-[#16a34a]">Authorized</strong>
                  </div>
                  <div className="flex items-center justify-between border-b border-line pb-2 dark:border-[#27272a]">
                    <span>Featured Libraries:</span>
                    <strong className="text-[#16a34a]">Authorized</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Dispute Resolution:</span>
                    <strong className="text-[#16a34a]">Full Access</strong>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedContent>
        </div>
      )}
    </div>
  );
}

