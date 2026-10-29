import Link from "next/link";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import AnimatedContent from "@/components/AnimatedContent";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "About Us | Scholar's Hub",
  description:
    "Empowering India's students with verified silent study spaces, live seat availability, and curated educational resources.",
};

const pillars = [
  {
    icon: Compass,
    title: "Real-Time Seat Visibility",
    desc: "Never travel across town only to find a full library. Browse real-time available seats and batch timings before you leave home.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Study Spaces",
    desc: "Every listed library undergoes verification for essential amenities: silent zones, high-speed WiFi, ergonomic seating, and power backup.",
  },
  {
    icon: GraduationCap,
    title: "Curated Study Notes",
    desc: "Free access to teacher-curated handwritten notes, previous year question papers, and revision guides for competitive exams.",
  },
  {
    icon: Award,
    title: "Digital Pass & Secure Payments",
    desc: "Seamless UPI/Card reservations with instant digital QR passes, official downloadable PDF invoices, and fair cancellation policies.",
  },
];

const stats = [
  { value: "50+", label: "Cities Across India" },
  { value: "500+", label: "Verified Libraries" },
  { value: "25,000+", label: "Study Hours Booked" },
  { value: "99.4%", label: "Student Satisfaction" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-sand-100/50 pb-20 pt-10 sm:pt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <AnimatedContent distance={25} duration={0.5} threshold={0}>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-forest-700/20 bg-forest-700/10 px-3.5 py-1 text-xs font-semibold text-forest-700">
              <Sparkles className="size-3.5" />
              Our Mission
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-forest-900 sm:text-6xl">
              Empowering Aspirants with the Ideal Space to Focus
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-forest-900/70 sm:text-lg">
              Scholar&apos;s Hub is India&apos;s leading platform uniting serious students
              with disciplined, verified reading rooms, digital study passes, and mentor-curated preparation notes.
            </p>
          </div>
        </AnimatedContent>

        {/* Stats Grid */}
        <AnimatedContent distance={20} duration={0.5} threshold={0} delay={0.08}>
          <div className="mt-12 grid grid-cols-2 gap-4 rounded-3xl border border-line bg-white/90 p-6 shadow-soft sm:grid-cols-4 sm:p-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl font-extrabold text-forest-700 sm:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-forest-900/60 sm:text-sm">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </AnimatedContent>

        {/* Core Pillars */}
        <AnimatedContent distance={20} duration={0.5} threshold={0} delay={0.12}>
          <div className="mt-16">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[#16a34a]">
                Why Scholar&apos;s Hub
              </p>
              <h2 className="mt-1.5 font-display text-2xl font-bold text-forest-900 sm:text-3xl">
                Built Around the Aspirant&apos;s Daily Routine
              </h2>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {pillars.map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.title}
                    className="group rounded-2xl border border-line bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-forest-700/40 hover:shadow-lg"
                  >
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#16a34a] transition-colors group-hover:bg-[#16a34a] group-hover:text-white">
                      <Icon className="size-6" />
                    </div>
                    <h3 className="mt-4 font-display text-xl font-semibold text-forest-900">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-forest-900/70">
                      {p.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </AnimatedContent>

        {/* For Students & Library Owners 2-Column Section */}
        <AnimatedContent distance={20} duration={0.5} threshold={0} delay={0.16}>
          <div className="mt-16 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-line bg-gradient-to-br from-white to-sage-100/30 p-8 shadow-soft">
              <Badge variant="outline" className="text-xs font-semibold text-forest-700">
                For Students &amp; Aspirants
              </Badge>
              <h3 className="mt-3 font-display text-2xl font-bold text-forest-900">
                Find Your Dedicated Corner
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-forest-900/75">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#16a34a]" /> Compare monthly, quarterly, and annual shift fees
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#16a34a]" /> Instant digital pass with QR code attendance check-in
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#16a34a]" /> Real-time alerts when waitlisted slots open up
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#16a34a]" /> Free access to curated notes, PYQs, and syllabus guides
                </li>
              </ul>
              <div className="mt-6">
                <Link
                  href="/libraries"
                  className="inline-flex h-11 items-center rounded-full bg-forest-700 px-6 text-sm font-semibold text-white transition hover:bg-forest-900"
                >
                  Browse Libraries Near You →
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-line bg-gradient-to-br from-white to-sand-100/40 p-8 shadow-soft">
              <Badge variant="outline" className="text-xs font-semibold text-forest-700">
                For Library Owners
              </Badge>
              <h3 className="mt-3 font-display text-2xl font-bold text-forest-900">
                Maximize Occupancy Effortlessly
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-forest-900/75">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#16a34a]" /> List your study space to thousands of local learners
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#16a34a]" /> Choose Instant confirmation or Owner Approval mode
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#16a34a]" /> Slot and batch management with automated waitlist fill
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#16a34a]" /> Automated monthly payout tracking and digital receipts
                </li>
              </ul>
              <div className="mt-6">
                <Link
                  href="/auth/signup/owner"
                  className="inline-flex h-11 items-center rounded-full border border-forest-700 bg-white px-6 text-sm font-semibold text-forest-700 transition hover:bg-forest-700 hover:text-white"
                >
                  Register Your Library →
                </Link>
              </div>
            </div>
          </div>
        </AnimatedContent>
      </div>
    </main>
  );
}
