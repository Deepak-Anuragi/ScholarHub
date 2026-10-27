"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Gift, IndianRupee } from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { api } from "@/lib/api";

export default function ReferralPage() {
  const [code, setCode]       = useState("");
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    api.get<{ referralCode: string; referralCredits: number }>("/student/referral")
      .then((d) => { setCode(d.referralCode); setCredits(d.referralCredits); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const shareLink = typeof window !== "undefined"
    ? `${window.location.origin}/auth/signup/student?ref=${code}`
    : "";

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6">
          <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">Refer a Friend</h1>
          <p className="mt-1 text-sm text-forest-900/60">
            Share your code. When a friend signs up and completes their first booking, you both get Rs.50 credit.
          </p>
        </div>
      </AnimatedContent>

      {loading ? (
        <div className="h-48 animate-pulse rounded-card bg-white" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Referral code card */}
          <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.05}>
            <div className="rounded-card border border-line bg-white p-6 shadow-soft">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#16a34a]/10">
                <Gift className="size-6 text-[#16a34a]" />
              </div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-forest-900/50">
                Your Referral Code
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="font-display text-4xl font-bold tracking-widest text-forest-900">
                  {code}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(code)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-forest-900/50 transition hover:border-[#16a34a] hover:text-[#16a34a]"
                  aria-label="Copy code"
                >
                  {copied ? <Check className="size-4 text-[#16a34a]" /> : <Copy className="size-4" />}
                </button>
              </div>

              {/* Share link */}
              <div className="mt-5">
                <p className="mb-1.5 text-xs font-semibold text-forest-900/50">Share Link</p>
                <div className="flex items-center gap-2 rounded-xl border border-line bg-sage-100/40 px-3 py-2">
                  <p className="flex-1 truncate text-xs text-forest-900/70">{shareLink}</p>
                  <button
                    type="button"
                    onClick={() => handleCopy(shareLink)}
                    className="shrink-0 text-xs font-semibold text-[#16a34a] hover:underline"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </AnimatedContent>

          {/* Credits card */}
          <AnimatedContent distance={20} duration={0.45} threshold={0} delay={0.1}>
            <div className="rounded-card border border-line bg-white p-6 shadow-soft">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-50">
                <IndianRupee className="size-6 text-amber-600" />
              </div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-forest-900/50">
                Credit Balance
              </p>
              <p className="mt-3 font-display text-4xl font-bold text-forest-900">
                Rs.{credits}
              </p>
              <p className="mt-2 text-sm text-forest-900/60">
                Applied automatically at checkout (up to Rs.50 per booking).
              </p>

              <div className="mt-6 space-y-3 border-t border-line pt-5">
                <p className="text-xs font-semibold text-forest-900/50">How it works</p>
                {[
                  "Share your code with friends",
                  "Friend signs up using your link",
                  "They complete their first booking",
                  "Both of you get Rs.50 credit",
                ].map((step, i) => (
                  <div key={step} className="flex items-start gap-3">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#16a34a]/10 text-xs font-bold text-[#16a34a]">
                      {i + 1}
                    </span>
                    <p className="text-sm text-forest-900/70">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedContent>
        </div>
      )}
    </div>
  );
}