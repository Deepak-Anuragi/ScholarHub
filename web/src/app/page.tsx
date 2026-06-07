import Link from "next/link";

import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { StatsSection } from "@/components/home/StatsSection";

export default function Home() {
  const featuredLibraries = [
    {
      name: "Green Arc Library",
      city: "Bhopal",
      rating: "4.8",
      fee: "Rs. 900",
      seats: "12",
      tags: ["WiFi", "AC", "CCTV"],
    },
    {
      name: "Pin Drop Reading Hall",
      city: "Indore",
      rating: "4.6",
      fee: "Rs. 750",
      seats: "6",
      tags: ["Locker", "Power", "Washroom"],
    },
    {
      name: "Focus Point Library",
      city: "Kota",
      rating: "4.9",
      fee: "Rs. 1100",
      seats: "18",
      tags: ["AC", "Parking", "CCTV"],
    },
    {
      name: "Sage Study Collective",
      city: "Jaipur",
      rating: "4.7",
      fee: "Rs. 820",
      seats: "9",
      tags: ["WiFi", "Drinking Water", "Generator"],
    },
  ];

  const testimonials = [
    {
      name: "Ritika S.",
      role: "UPSC Aspirant, Delhi",
      quote:
        "The seat availability badge saved me so many trips. I booked the same day.",
    },
    {
      name: "Aditya V.",
      role: "JEE Aspirant, Kota",
      quote:
        "Shift-wise booking is perfect for coaching schedules. Payments were smooth.",
    },
    {
      name: "Muskan R.",
      role: "Library Owner, Indore",
      quote:
        "My occupancy is higher and the waitlist alerts keep me updated automatically.",
    },
  ];

  return (
    <div className="min-h-screen bg-sand-100 text-ink">
      <div className="relative -mt-[var(--header-height)] pt-[var(--header-height)]">
        <HeroSection />
      </div>

      <StatsSection />
      <HowItWorksSection />

      <section
        id="featured"
        className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-forest-900/70">
              Featured libraries
            </p>
            <h2 className="font-display text-3xl text-forest-900">
              Top-rated spaces with live seats
            </h2>
          </div>
          <Link
            href="/libraries"
            className="inline-flex h-11 items-center rounded-full border border-line bg-white/70 px-5 text-sm font-semibold text-forest-900 transition hover:border-forest-700"
          >
            View all listings
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {featuredLibraries.map((library) => (
            <div
              key={library.name}
              className="flex flex-col gap-4 rounded-card border border-line bg-white/80 p-6 shadow-soft"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold text-forest-900">
                    {library.name}
                  </p>
                  <p className="text-sm text-forest-900/70">{library.city}</p>
                </div>
                <span className="rounded-full bg-sage-100 px-3 py-1 text-sm font-semibold text-forest-900">
                  {library.seats} seats
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-forest-700 px-3 py-1 text-sm font-semibold text-sand-100">
                  {library.rating}
                </span>
                <span className="text-sm text-forest-900/70">
                  Starting at {library.fee}/month
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {library.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-line bg-white px-3 py-1 text-sm text-forest-900"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href="/libraries"
                className="inline-flex h-11 items-center justify-center rounded-full bg-forest-700 px-5 text-sm font-semibold text-sand-100 transition hover:bg-forest-900"
              >
                View details
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section id="insights" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-card border border-line bg-white/80 p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-wide text-forest-900/70">
              Live seat map
            </p>
            <h2 className="mt-2 font-display text-3xl text-forest-900">
              City-wide availability at a glance
            </h2>
            <p className="mt-3 text-sm text-forest-900/70">
              See color-coded pins, distance filters, and shift-based seats
              without leaving the map.
            </p>
            <ul className="mt-6 grid gap-3 text-sm text-forest-900/75">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-forest-700" />
                Green pins show seats available now
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sage-200" />
                Yellow pins show fewer than 5 seats
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sage-300" />
                Red pins show fully booked libraries
              </li>
            </ul>
          </div>
          <div className="rounded-card border border-line bg-sage-100/70 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-forest-900">
                Seat demand pulse
              </p>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-forest-900">
                Updated 2 min ago
              </span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { city: "Delhi", fill: "92%", trend: "+8%" },
                { city: "Lucknow", fill: "84%", trend: "+5%" },
                { city: "Kota", fill: "96%", trend: "+11%" },
                { city: "Pune", fill: "78%", trend: "+3%" },
              ].map((item) => (
                <div
                  key={item.city}
                  className="rounded-2xl bg-white/80 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-forest-900">
                    {item.city}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-sm text-forest-900/70">
                    <span>{item.fill} full</span>
                    <span className="font-semibold text-forest-700">
                      {item.trend}
                    </span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-sage-100">
                    <div
                      className="h-2 rounded-full bg-forest-700"
                      style={{ width: item.fill }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="testimonials"
        className="border-y border-line bg-white/80"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-forest-900/70">
                Testimonials
              </p>
              <h2 className="font-display text-3xl text-forest-900">
                Stories from students and owners
              </h2>
            </div>
            <button
              type="button"
              className="h-11 rounded-full border border-line bg-white/70 px-5 text-sm font-semibold text-forest-900 transition hover:border-forest-700"
            >
              Read more stories
            </button>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {testimonials.map((item) => (
              <figure
                key={item.name}
                className="rounded-card border border-line bg-sage-100/60 p-6"
              >
                <blockquote className="text-sm text-forest-900/80">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4">
                  <p className="text-sm font-semibold text-forest-900">
                    {item.name}
                  </p>
                  <p className="text-sm text-forest-900/70">{item.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="rounded-card border border-line bg-forest-700 px-6 py-10 text-sand-100 shadow-lift sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-sand-100/70">
                Ready to study smarter?
              </p>
              <h2 className="mt-3 font-display text-3xl">
                Claim your seat in minutes.
              </h2>
              <p className="mt-2 text-sm text-sand-100/80">
                Join thousands of students finding verified libraries without
                the commute.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/signup"
                className="inline-flex h-12 items-center justify-center rounded-full bg-sand-100 px-6 text-sm font-semibold text-forest-900 transition hover:bg-white"
              >
                Get started
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-full border border-sand-100/60 px-6 text-sm font-semibold text-sand-100 transition hover:border-white"
              >
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
