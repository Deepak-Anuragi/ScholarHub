import Link from "next/link";
import {
  BookMarked,
  CreditCard,
  FileQuestion,
  HelpCircle,
  Mail,
  MessageCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";

export const metadata = {
  title: "Support & Help Center | Scholar's Hub",
  description:
    "Get instant help with your library seat booking, cancellation preview, digital passes, and payment receipts.",
};

const helpCategories = [
  {
    icon: CreditCard,
    title: "Bookings & Payments",
    description: "Questions about slot pricing, UPI/card payment confirmation, and automated fee receipts.",
    linkText: "View booking guides",
    href: "/#faqs",
  },
  {
    icon: BookMarked,
    title: "Digital ID & Attendance",
    description: "How to access your QR attendance pass on mobile, offline passes, and check-in protocols.",
    linkText: "Learn about Digital ID",
    href: "/student/bookings",
  },
  {
    icon: RefreshCcw,
    title: "Cancellations & Refunds",
    description: "Timeline refund tiers, automated waitlist seat reallocation, and credit disbursements.",
    linkText: "Check refund policy",
    href: "/terms",
  },
  {
    icon: ShieldCheck,
    title: "Library Listing & Verification",
    description: "How library owners can set up slots, manage approval modes, and receive monthly payouts.",
    linkText: "Owner guides",
    href: "/auth/signup/owner",
  },
];

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-sand-100/50 pb-20 pt-10 sm:pt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <AnimatedContent distance={25} duration={0.5} threshold={0}>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-forest-700/20 bg-forest-700/10 px-3.5 py-1 text-xs font-semibold text-forest-700">
              <Sparkles className="size-3.5" />
              Help &amp; Documentation
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-forest-900 sm:text-5xl">
              How Can We Assist You Today?
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-forest-900/70 sm:text-lg">
              Explore self-serve resources, booking walkthroughs, or reach our live support desk.
            </p>
          </div>
        </AnimatedContent>

        {/* 4 Categorized Cards */}
        <AnimatedContent distance={20} duration={0.5} threshold={0} delay={0.08}>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {helpCategories.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className="group flex flex-col justify-between rounded-2xl border border-line bg-white p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-forest-700/30 hover:shadow-lg"
                >
                  <div>
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#16a34a] transition-colors group-hover:bg-[#16a34a] group-hover:text-white">
                      <Icon className="size-6" />
                    </div>
                    <h3 className="mt-4 font-display text-xl font-semibold text-forest-900">
                      {c.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-forest-900/65">
                      {c.description}
                    </p>
                  </div>
                  <div className="mt-6 border-t border-line/70 pt-4">
                    <Link
                      href={c.href}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-700 transition group-hover:text-forest-900"
                    >
                      {c.linkText} →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </AnimatedContent>

        {/* Live Support Help Box */}
        <AnimatedContent distance={20} duration={0.5} threshold={0} delay={0.12}>
          <div className="mt-12 rounded-3xl border border-line bg-gradient-to-br from-white to-sage-100/30 p-8 shadow-soft sm:p-10">
            <div className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
              <div>
                <h3 className="font-display text-2xl font-bold text-forest-900">
                  Still have questions or need booking assistance?
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-forest-900/70">
                  Our customer support specialists are ready to help with reservation transfers,
                  payment verification, or finding study spaces in your neighborhood.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-forest-700 px-6 text-sm font-semibold text-white shadow-xs transition hover:bg-forest-900"
                >
                  <Mail className="size-4" /> Contact Us
                </Link>
                <Link
                  href="/#faqs"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-6 text-sm font-semibold text-forest-900 shadow-xs transition hover:border-forest-700"
                >
                  <HelpCircle className="size-4 text-forest-900/60" /> Browse FAQs
                </Link>
              </div>
            </div>
          </div>
        </AnimatedContent>
      </div>
    </main>
  );
}
