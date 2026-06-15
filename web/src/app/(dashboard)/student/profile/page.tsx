"use client";

import { useState } from "react";
import { Loader2, User } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const EXAM_TYPES = ["UPSC", "SSC", "JEE", "NEET", "Board", "Professional", "Other"];

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const initials = (user?.name ?? "S")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    // TODO: PATCH /api/student/profile
    await new Promise((r) => setTimeout(r, 800));
    await refresh();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6">
          <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-forest-900/60">
            Update your personal information
          </p>
        </div>
      </AnimatedContent>

      <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
        <div className="max-w-lg">
          {/* Avatar */}
          <div className="mb-6 flex items-center gap-4">
            <Avatar size="lg">
              {user?.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.name} />
              ) : null}
              <AvatarFallback className="bg-[#16a34a]/15 text-lg font-bold text-[#16a34a]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-forest-900">
                {user?.name ?? "—"}
              </p>
              <p className="text-sm text-forest-900/50">{user?.email}</p>
              <p className="mt-0.5 inline-flex rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-forest-900">
                {user?.role}
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => void handleSave(e)}
            className="space-y-4 rounded-card border border-line bg-white p-5 shadow-soft"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
                Full name
                <input
                  name="name"
                  defaultValue={user?.name ?? ""}
                  className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-[#16a34a]"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
                City
                <input
                  name="city"
                  className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-[#16a34a]"
                  placeholder="Your city"
                />
              </label>
            </div>

            <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
              Email address
              <input
                name="email"
                type="email"
                defaultValue={user?.email ?? ""}
                disabled
                className="h-10 rounded-xl border border-line bg-sage-100/30 px-3 text-sm text-forest-900/50 outline-none"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
              Exam type
              <select
                name="examType"
                className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-[#16a34a]"
              >
                <option value="">Select exam type</option>
                {EXAM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
              Target year
              <input
                name="targetYear"
                type="number"
                min={new Date().getFullYear()}
                max={new Date().getFullYear() + 5}
                placeholder={String(new Date().getFullYear() + 1)}
                className="h-10 rounded-xl border border-line bg-sage-100/40 px-3 text-sm text-forest-900 outline-none transition focus:border-[#16a34a]"
              />
            </label>

            <Button
              type="submit"
              className="w-full bg-[#16a34a] text-white hover:bg-[#15803d]"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : saved ? (
                "✓ Saved!"
              ) : (
                <>
                  <User className="size-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </div>
      </AnimatedContent>
    </div>
  );
}
