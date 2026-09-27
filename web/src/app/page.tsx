import Link from "next/link";
import { ChevronDown, Star, MapPin, BookOpen, TrendingUp } from "lucide-react";

import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { StatsSection } from "@/components/home/StatsSection";

export default function Home() {
  const featuredLibraries = [
    {
      name: "Green Arc Library",
      city: "Bhopal",
      rating: "4.8",
      fee: "900",
      seats: "12",
      tags: ["WiFi", "AC", "CCTV"],
      available: true,
    },
    {
      name: "Pin Drop Reading Hall",
      city: "Indore",
      rating: "4.6",
      fee: "750",
      seats: "6",
      tags: ["Locker", "Power", "Washroom"],
      available: true,
    },
    {
      name: "Focus Point Library",
      city: "Kota",
      rating: "4.9",
      fee: "1100",
      seats: "18",
      tags: ["AC", "Parking", "CCTV"],
      available: false,
    },
    {
      name: "Sage Study Collective",
      city: "Jaipur",
      rating: "4.7",
      fee: "820",
      seats: "9",
      tags: ["WiFi", "Drinking Water", "Generator"],
      available: true,
    },
  ];

  const testimonials = [
    {
      name: "Ritika S.",
      role: "UPSC Aspirant, Delhi",
      initials: "RS",
      quote: "The seat availability badge saved me so many trips. I booked the same day.",
      rating: 5,
    },
    {
      name: "Aditya V.",
      role: "JEE Aspirant, Kota",
      initials: "AV",
      quote: "Shift-wise booking is perfect for coaching schedules. Payments were smooth.",
      rating: 5,
    },
    {
      name: "Muskan R.",
      role: "Library Owner, Indore",
      initials: "MR",
      quote: "My occupancy is higher and the waitlist alerts keep me updated automatically.",
      rating: 5,
    },
  ];

  const faqs = [
    {
      question: "How do I find a library near me?",
      answer: "Enter your city on the homepage, choose your exam type, and select Search. You can then compare libraries by seats, fees, facilities, and availability.",
    },
    {
      question: "Can I see how many seats are available before booking?",
      answer: "Yes. Each listing shows its current seat availability, so you can choose a library and shift that works for you before reserving.",
    },
    {
      question: "How does library booking work?",
      answer: "Open a library listing, select a plan and start date, then complete the booking and payment steps. Your confirmed booking will appear in your dashboard.",
    },
    {
      question: "Can I cancel my booking?",
      answer: "Cancellation depends on the library's policy and the booking status. Open your booking from the dashboard to see the available action and refund details.",
    },
    {
      question: "How can I list my library?",
      answer: "Choose List Your Library or Add Library in the footer, create an owner account, and submit your library details for verification.",
    },
    {
      question: "Is online payment secure?",
      answer: "Payments are processed through the secure checkout flow. Your booking is confirmed only after the payment provider reports a successful transaction.",
    },
  ];

  return (
    <div className="min-h-screen bg-sand-100 text-ink">

      {/* -- Hero ---------------------------------------------------------- */}
      <div className="relative -mt-[var(--header-height)] pt-[var(--header-height)]">
        <HeroSection />
      </div>

      {/* -- Stats --------------------------------------------------------- */}
      <StatsSection />

      {/* -- How It Works -------------------------------------------------- */}
      <HowItWorksSection />

      {/* -- Featured Libraries -------------------------------------------- */}
      <section id="featured" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#16a34a]">
              Featured libraries
            </p>
            <h2 className="mt-1 font-display text-3xl text-forest-900 sm:text-4xl">
              Top-rated spaces with live seats
            </h2>
          </div>
          <Link
            href="/libraries"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-white/70 dark:bg-[#27272a] dark:border-[#3f3f46] dark:text-white px-5 text-sm font-semibold text-forest-900 transition hover:border-[#16a34a] hover:text-[#16a34a]"
          >
            View all listings →
          </Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {featuredLibraries.map((library) => (
            <div
              key={library.name}
              className="group flex flex-col gap-4 rounded-card border border-line bg-white/80 p-6 shadow-soft transition-all duration-200 hover:shadow-lift hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-[#16a34a]/10 text-[#16a34a]">
                    <BookOpen className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-forest-900">{library.name}</p>
                    <p className="flex items-center gap-1 text-xs text-forest-900/60">
                      <MapPin className="size-3" />{library.city}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${library.available ? "bg-[#16a34a]/10 text-[#16a34a]" : "bg-red-50 text-red-600"}`}>
                  {library.available ? `${library.seats} seats left` : "Full"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  {library.rating}
                </span>
                <span className="text-sm text-forest-900/70">
                  From <strong className="text-forest-900">₹{library.fee}</strong>/month
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {library.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-line bg-sage-100/60 dark:bg-[#27272a] dark:border-[#3f3f46] dark:text-white px-3 py-0.5 text-xs font-medium text-forest-900"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <Link
                href="/libraries"
                className="mt-auto inline-flex h-10 items-center justify-center rounded-full bg-[#16a34a] px-5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
              >
                View details
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* -- Insights ------------------------------------------------------ */}
      <section id="insights" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">

          {/* Map teaser */}
          <div className="rounded-card border border-line bg-white/80 p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#16a34a]">Live seat map</p>
            <h2 className="mt-2 font-display text-2xl text-forest-900 sm:text-3xl">
              City-wide availability at a glance
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-forest-900/70">
              See colour-coded pins, distance filters, and shift-based seats without leaving the map.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                { dot: "bg-[#16a34a]",  label: "Green pins — seats available now" },
                { dot: "bg-amber-400",  label: "Yellow pins — fewer than 5 seats" },
                { dot: "bg-red-400",    label: "Red pins — fully booked" },
              ].map(({ dot, label }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm text-forest-900/75">
                  <span className={`size-2.5 shrink-0 rounded-full ${dot}`} />
                  {label}
                </li>
              ))}
            </ul>
            <Link
              href="/map"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-[#16a34a] px-5 text-sm font-semibold text-white transition hover:bg-[#15803d]"
            >
              <MapPin className="size-4" /> Open Live Map
            </Link>
          </div>

          {/* Demand pulse */}
          <div className="rounded-card border border-line bg-white/80 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-[#16a34a]" />
                <p className="text-sm font-semibold text-forest-900">Seat demand pulse</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-white dark:bg-[#27272a] dark:text-white px-3 py-1 text-xs font-medium text-forest-900/70">
                <span className="size-1.5 rounded-full bg-[#16a34a] animate-pulse" />
                Live
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { city: "Delhi",   fill: 92, trend: "+8%" },
                { city: "Lucknow", fill: 84, trend: "+5%" },
                { city: "Kota",    fill: 96, trend: "+11%" },
                { city: "Pune",    fill: 78, trend: "+3%" },
              ].map((item) => (
                <div key={item.city} className="rounded-2xl bg-white/80 dark:bg-[#27272a] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-forest-900">{item.city}</p>
                    <span className="text-xs font-bold text-[#16a34a]">{item.trend}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-forest-900/60">{item.fill}% occupied</p>
                  <div className="mt-2.5 h-1.5 rounded-full bg-sage-100 dark:bg-[#3f3f46]">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-700 ${item.fill >= 90 ? "bg-red-400" : item.fill >= 80 ? "bg-amber-400" : "bg-[#16a34a]"}`}
                      style={{ width: `${item.fill}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -- Testimonials -------------------------------------------------- */}
      <section
        id="testimonials"
        className="border-y border-line bg-white/80 dark:bg-[#18181b] dark:border-[#27272a]"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#16a34a]">Testimonials</p>
            <h2 className="mt-2 font-display text-3xl text-forest-900 sm:text-4xl">
              Stories from students and owners
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-forest-900/70">
              Real experiences from people who found their study space on Scholar's Hub.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {testimonials.map((item) => (
              <figure
                key={item.name}
                className={`flex flex-col rounded-card border p-6 shadow-soft ${item.name === "Aditya V." ? "border-[#16a34a]/20 bg-[#16a34a]/5" : "border-line bg-white/80"}`}
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-forest-900/80">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#16a34a]/15 text-sm font-bold text-[#16a34a]">
                    {item.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-forest-900">{item.name}</p>
                    <p className="text-xs text-forest-900/60">{item.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* -- FAQs ---------------------------------------------------------- */}
      <section id="faqs" className="scroll-mt-24 bg-sand-100 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#16a34a]">FAQs</p>
            <h2 className="mt-2 font-display text-3xl text-forest-900 sm:text-4xl">
              Answers before you book
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-forest-900/70 sm:text-base">
              Everything you need to know about finding, comparing, and booking your next study space.
            </p>
          </div>

          <div className="mt-10 space-y-2">
            {faqs.map((faq, index) => (
              <details
                key={faq.question}
                open={index === 0}
                className="group rounded-2xl border border-line bg-white/85 shadow-soft transition-all open:shadow-lift"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left text-sm font-semibold text-forest-900 transition hover:bg-sage-100/50 marker:hidden [&::-webkit-details-marker]:hidden sm:px-6 sm:py-5 sm:text-base">
                  {faq.question}
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sage-100 text-forest-700 transition-transform duration-200 group-open:rotate-180 group-open:bg-[#16a34a]/10 group-open:text-[#16a34a]">
                    <ChevronDown className="size-4" aria-hidden />
                  </span>
                </summary>
                <p className="border-t border-line px-5 pb-5 pt-4 text-sm leading-7 text-forest-900/70 sm:px-6">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* -- CTA Banner ---------------------------------------------------- */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-card bg-[#16a34a] px-6 py-12 shadow-lift sm:px-10">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 size-40 rounded-full bg-black/10 blur-2xl" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-white/70">
                Ready to study smarter?
              </p>
              <h2 className="mt-2 font-display text-3xl text-white sm:text-4xl">
                Claim your seat in minutes.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/80">
                Join 10,000+ students finding verified libraries near them — no phone calls, no guesswork.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/signup"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-bold text-[#16a34a] shadow-md transition hover:bg-sand-100"
              >
                Get started free
              </Link>
              <Link
                href="/libraries"
                className="inline-flex h-12 items-center justify-center rounded-full border-2 border-white/40 px-7 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
              >
                Browse libraries
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}